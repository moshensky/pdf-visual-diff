# bare-bones example how to use pdf-visual-diff lib

This is a bare-bones example how `comparePdfToSnapshot` could be used. It does not exercise any of the options that could be passed in for the sake of simplicity.

## How to run

In terminal go into the folder where this README is located.
Observe that directory `__snapshots__` should not exists.
Run in terminal:

```sh
node index.js
```

Please note that I test run it under node v10.9.0
After the first run a `__snaphosts__` directory should be created with a snapshot `png` file inside it of the pdf.

Now run it for the second time:

```sh
node index.js
```

Because the snapshot already exists, the pdf will be compared to it. The program output should equal to `Is pdf equal to it's snapshot? Answer: true`.
You could try replacing the snapshot file `single-page-snapshot.png` inside `__snapshots__` dir and run the program again. If you replace it with some random image you should see in the terminal `Answer: false`.
