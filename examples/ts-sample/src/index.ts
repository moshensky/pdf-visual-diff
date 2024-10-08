import pdfmake from 'pdfmake/build/pdfmake'
import pdffonts from 'pdfmake/build/vfs_fonts'
import { TDocumentDefinitions } from 'pdfmake/interfaces'

pdfmake.vfs = pdffonts.pdfMake.vfs

/**
 * Dynamically create a PDF file.
 *
 * This is a sample function to demonstrate how `pdf-visual-diff` could be used.
 *
 * @param text - optional text that will be added to the end of the PDF file.
 */
export const mkSamplePdf = (text?: string): Promise<Buffer> => {
  const docDefinition: TDocumentDefinitions = {
    content: [
      {
        text: 'Paragraphs can also by styled without using named-styles (this one sets fontSize to 25)',
        fontSize: 25,
      },
      'Another paragraph, using default style, this time a little bit longer to make sure, this line will be divided into at least two lines\n\n',
      {
        text: 'This paragraph does not use a named-style and sets fontSize to 8 and italics to true',
        fontSize: 8,
        italics: true,
      },
      '\n\nFor preserving leading spaces use preserveLeadingSpaces property:',
      {
        text: '    This is a paragraph with preserved leading spaces.',
        preserveLeadingSpaces: true,
      },
      { text: '{', preserveLeadingSpaces: true },
      { text: '    "sample": {', preserveLeadingSpaces: true },
      { text: '        "json": "nested"', preserveLeadingSpaces: true },
      { text: '    }', preserveLeadingSpaces: true },
      { text: '}', preserveLeadingSpaces: true },
      '\n\nfontFeatures property:',
      { text: 'Hello World 1234567890', fontFeatures: ['smcp'] },
      { text: 'Hello World 1234567890', fontFeatures: ['c2sc'] },
      { text: 'Hello World 1234567890', fontFeatures: ['onum'] },
      { text: 'Hello World 1234567890', fontFeatures: ['onum', 'c2sc'] },
      ...(text === undefined ? [] : [{ text }]),
    ],
  }

  return new Promise<Buffer>((resolve) => pdfmake.createPdf(docDefinition).getBuffer(resolve)).then(
    Buffer.from,
  )
}
