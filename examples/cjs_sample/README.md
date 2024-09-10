# Example Usage of `pdf-visual-diff` Library

This example demonstrates how to use the `comparePdfToSnapshot` function from the `pdf-visual-diff` library. For simplicity, this example does not include any optional parameters.

## Installation

This project depends on the transitive dependency `canvas` package. Please refer to the [canvas documentation](https://github.com/Automattic/node-canvas) for any additional installation steps.

```sh
nvm use
npm install
```

## How to Run

1. Open a terminal and navigate to the directory containing this README file.
2. Ensure that the `__snapshots__` directory does not exist.

### First Run

Run the following command in the terminal:

```sh
node index.js
```

After the first run, a `__snapshots__` directory will be created with a snapshot `png` file of the PDF.

### Second Run

Run the command again:

```sh
node index.js
```

Since the snapshot already exists, the PDF will be compared to it. The program output should be:

```sh
Is pdf equal to its snapshot? Answer: true
```

### Testing with Updated Pdf

1. Open `index.js` and comment out the line:

   ```js
     `const pathToPdf = join(__dirname, 'pdf', 'test_doc_1.pdf')`
   ```

2. Uncomment the following line:

   ```js
     const pathToPdf = join(__dirname, 'pdf', 'test_doc_1_changed.pdf')
   ```

Run the command again:

```sh
node index.js
```

Since the snapshot already exists, the PDF will be compared to it. The program output should be:

```sh
Is pdf equal to it's snapshot? Answer: false`
```

The comparison will fail. Open the `__snapshots__` directory. It will contain `.diff` and `.new` PNG files.

If you want to make new snapshot the current one, run:

```sh
npx pdf-visual-diff approve
```

After confirming the command, you will see that only the new snapshot is left in the directory as the current one.
