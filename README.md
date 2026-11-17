# react-native-pdf-renderer: password-protected PDF crash on Android

Minimal reproduction for an Android crash in [react-native-pdf-renderer](https://github.com/douglasjunior/react-native-pdf-renderer) 2.3.0 when `PdfRendererView` is given a password-protected PDF.

Related upstream issues:

- [#64 PDF's with passwords do not work on Android](https://github.com/douglasjunior/react-native-pdf-renderer/issues/64) (same crash, closed as not planned)
- [#50 Add error handler (e.g. onError)](https://github.com/douglasjunior/react-native-pdf-renderer/issues/50) (introduced `onError` in 2.1.0)

## The problem

Android's `PdfRenderer` throws `java.lang.SecurityException` when it opens an encrypted document. `SecurityException` is unchecked, so it escapes the `catch (IOException e)` in `PdfRendererViewManagerImpl.setParams`. `onError` never fires and the app crashes.

This repo does not ask for password support. It only shows that an unsupported file should reach `onError` like a corrupted file does, instead of crashing the app.

## Environment

- react-native-pdf-renderer 2.3.0
- Expo SDK 57, React Native 0.86.3, new architecture
- Reproduced on an Android 16 (API 36) emulator

## Run it

Requires Node.js 22+, JDK 17+ and an Android emulator or device.

```sh
npm install
npm run android
```

`npm run android` runs `expo run:android`, which generates the native project, builds a development client and starts Metro.

## Reproduce

1. Tap **Open sample.pdf**. The page renders.
2. Tap **Open password-protected.pdf**.

**Expected:** `onError` fires and the status text reads "onError fired".

**Actual (`main`):** the app crashes.

```
FATAL EXCEPTION: main
java.lang.SecurityException: Password required to access document
  at com.github.douglasjunior.reactNativePdfRenderer.modules.PdfRendererRecyclerView$PdfRendererAdapter.updateSource(PdfRendererRecyclerView.java:348)
  at com.github.douglasjunior.reactNativePdfRenderer.modules.PdfRendererRecyclerView.updateSource(PdfRendererRecyclerView.java:132)
  at com.github.douglasjunior.reactNativePdfRenderer.PdfRendererViewManagerImpl.lambda$setParams$0(PdfRendererViewManagerImpl.java:77)
```

Older Android versions report the message as `password required or incorrect password`. The exception type and stack are the same.

## Proposed fix

The [`with-fix`](https://github.com/wddwycc/rn-pdf-renderer-password-repro/tree/with-fix) branch applies the fix with `patch-package` ([`patches/react-native-pdf-renderer+2.3.0.patch`](https://github.com/wddwycc/rn-pdf-renderer-password-repro/blob/with-fix/patches/react-native-pdf-renderer%2B2.3.0.patch)):

- `PdfRendererViewManagerImpl.setParams` catches `SecurityException` alongside `IOException`, so the existing `onError` event fires.
- `PdfRendererAdapter.updateSource` closes the file descriptor when `PdfRenderer` fails to open, so it is not leaked.

To try it, rebuild the native app because the patch changes Java code:

```sh
git checkout with-fix
npm install
npm run android
```

With the fix, step 2 shows "onError fired", the app keeps running, and `sample.pdf` still renders afterwards.

## Files

| Path | Purpose |
| --- | --- |
| `App.tsx` | Two buttons that load a bundled PDF into `PdfRendererView` and show when `onError` fires |
| `assets/sample.pdf` | One-page unencrypted PDF |
| `assets/password-protected.pdf` | The same page encrypted with AES-128, user password `password` |
| `metro.config.js` | Registers `.pdf` as an asset extension so the PDFs can be bundled |
