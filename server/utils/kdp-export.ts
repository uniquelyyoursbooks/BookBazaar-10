import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import archiver from 'archiver';

const execPromise = promisify(exec);

// Base directory for temporary files and exports
const TEMP_DIR = path.join(process.cwd(), 'tmp');
const EXPORTS_DIR = path.join(process.cwd(), 'exports');

// Ensure directories exist
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

/**
 * Process a cover image for KDP requirements
 * @param coverPath Path to the original cover image
 * @param bookTitle Book title for file naming
 * @param exportType 'print' or 'ebook'
 */
export async function processKdpCover(
  coverPath: string,
  bookTitle: string,
  exportType: 'print' | 'ebook'
): Promise<string> {
  const sanitizedTitle = bookTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const outputFilename = `${sanitizedTitle}_cover_${exportType}.jpg`;
  const outputPath = path.join(TEMP_DIR, outputFilename);

  try {
    // Use ImageMagick (convert) to process the image to KDP specs
    // For ebooks: RGB color space, 2560x1600 resolution
    // For print: CMYK color space, 300 DPI
    const colorSpace = exportType === 'ebook' ? 'RGB' : 'CMYK';
    const resolution = exportType === 'ebook' ? '2560x1600' : '300';

    const command = `convert "${coverPath}" -resize ${resolution} -colorspace ${colorSpace} -quality 100 "${outputPath}"`;
    
    try {
      await execPromise(command);
      console.log(`Cover processed successfully: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('Error processing cover with ImageMagick:', error);
      
      // Fallback: If ImageMagick fails, just copy the file
      fs.copyFileSync(coverPath, outputPath);
      console.log(`Cover copied (without processing) to: ${outputPath}`);
      return outputPath;
    }
  } catch (error) {
    console.error('Error in cover processing:', error);
    throw new Error('Failed to process cover for KDP');
  }
}

/**
 * Process a manuscript file for KDP requirements
 * @param filePath Path to the original manuscript file
 * @param bookTitle Book title for file naming
 * @param exportType 'print' or 'ebook'
 * @param extension File extension (pdf, epub)
 */
export async function processKdpManuscript(
  filePath: string,
  bookTitle: string,
  exportType: 'print' | 'ebook'
): Promise<string> {
  const sanitizedTitle = bookTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const originalExt = path.extname(filePath).toLowerCase();
  
  // Determine desired output format based on export type
  const targetExt = exportType === 'ebook' ? '.epub' : '.pdf';
  const outputFilename = `${sanitizedTitle}_manuscript${targetExt}`;
  const outputPath = path.join(TEMP_DIR, outputFilename);

  // If file is already in the correct format, just copy it
  if (originalExt === targetExt) {
    fs.copyFileSync(filePath, outputPath);
    console.log(`Manuscript copied to: ${outputPath}`);
    return outputPath;
  }

  try {
    // For PDF to EPUB conversion (ebook)
    if (originalExt === '.pdf' && targetExt === '.epub') {
      // This is a placeholder. Actual conversion would require a tool like Calibre
      // For now, we'll just copy the PDF
      fs.copyFileSync(filePath, outputPath.replace('.epub', '.pdf'));
      console.log(`Manuscript copied (without conversion) to: ${outputPath.replace('.epub', '.pdf')}`);
      return outputPath.replace('.epub', '.pdf');
    }

    // For EPUB to PDF conversion (print)
    if (originalExt === '.epub' && targetExt === '.pdf') {
      // Another placeholder. Would require conversion tool
      fs.copyFileSync(filePath, outputPath.replace('.pdf', '.epub'));
      console.log(`Manuscript copied (without conversion) to: ${outputPath.replace('.pdf', '.epub')}`);
      return outputPath.replace('.pdf', '.epub');
    }

    // If we can't convert, just copy with original extension
    const fallbackPath = outputPath.replace(targetExt, originalExt);
    fs.copyFileSync(filePath, fallbackPath);
    console.log(`Manuscript copied to: ${fallbackPath}`);
    return fallbackPath;
  } catch (error) {
    console.error('Error in manuscript processing:', error);
    throw new Error('Failed to process manuscript for KDP');
  }
}

/**
 * Package KDP files into a ZIP archive
 * @param files Array of file paths to include in the archive
 * @param bookTitle Book title for file naming
 */
export async function createKdpZipPackage(
  files: string[],
  bookTitle: string,
  exportType: 'print' | 'ebook'
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const sanitizedTitle = bookTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const timestamp = new Date().getTime();
      const zipFilename = `${sanitizedTitle}_kdp_${exportType}_${timestamp}.zip`;
      const zipPath = path.join(EXPORTS_DIR, zipFilename);
      
      // Create a file to stream archive data to
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Best compression
      });
      
      // Listen for all archive data to be written
      output.on('close', () => {
        console.log(`KDP ZIP created successfully: ${zipPath} (${archive.pointer()} bytes)`);
        resolve(zipPath);
      });
      
      // Listen for warnings (non-fatal errors)
      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn('Archive warning:', err);
        } else {
          reject(err);
        }
      });
      
      // Listen for fatal errors
      archive.on('error', (err) => {
        reject(err);
      });
      
      // Pipe archive data to the file
      archive.pipe(output);
      
      // Add files to the archive
      for (const file of files) {
        if (fs.existsSync(file)) {
          const filename = path.basename(file);
          archive.file(file, { name: filename });
        }
      }
      
      // Add a README.txt file with instructions
      const readmeContent = `
KDP Export Package for "${bookTitle}"
Export Type: ${exportType === 'ebook' ? 'Kindle eBook' : 'Print Book'}
Exported on: ${new Date().toLocaleString()}

Files included:
${files.map(f => `- ${path.basename(f)}`).join('\n')}

Instructions:
1. Log in to your KDP account at https://kdp.amazon.com
2. Create a new ${exportType === 'ebook' ? 'Kindle eBook' : 'Paperback Book'}
3. Fill in your book details (title, description, etc.)
4. Upload your manuscript and cover files when prompted
5. Preview your book to ensure everything looks correct
6. Submit for publishing

For more information, visit Amazon KDP Help:
https://kdp.amazon.com/en_US/help/topic/G200735480
      `;
      
      archive.append(readmeContent, { name: 'README.txt' });
      
      // Finalize the archive
      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Prepare a book for KDP export
 */
export async function prepareBookForKdp(params: {
  bookId: number;
  title: string;
  coverPath: string;
  manuscriptPath: string;
  exportType: 'print' | 'ebook';
}): Promise<{zipPath: string}> {
  try {
    const { title, coverPath, manuscriptPath, exportType } = params;
    const filesToPackage: string[] = [];
    
    // Process manuscript
    const processedManuscript = await processKdpManuscript(
      manuscriptPath,
      title,
      exportType
    );
    filesToPackage.push(processedManuscript);
    
    // Process cover
    const processedCover = await processKdpCover(
      coverPath,
      title,
      exportType
    );
    filesToPackage.push(processedCover);
    
    if (filesToPackage.length === 0) {
      throw new Error('No files to package for KDP export');
    }
    
    // Create ZIP package
    const zipPath = await createKdpZipPackage(
      filesToPackage,
      title,
      exportType
    );
    
    return { zipPath };
  } catch (error) {
    console.error('Error in KDP export:', error);
    throw new Error('Failed to prepare book for KDP export');
  }
}