# DynamicResizer Component

The `DynamicResizer` component is a flexible React component that allows users to resize two sections (either vertically or horizontally) by dragging a divider. This component provides features such as persisting the resize state to local storage and allowing minimum size constraints for the sections.

## Features

- **Resizable Sections**: Users can resize either the top/bottom sections (in vertical mode) or the left/right sections (in horizontal mode) by dragging a divider.
- **Local Storage**: Stores the dimensions of the sections in local storage to preserve the state between sessions.
- **Customizable Layout**: Supports both vertical and horizontal resizing.
- **Min Size Constraints**: Allows setting minimum heights/widths for both top/bottom or left/right sections.
- **Reset Size Functionality**: Provides a way to reset the size of the sections programmatically.
- **Optional Shortcut Button**: Enables an optional button to quickly reset section sizes.

## Installation

Install the required dependencies using npm or yarn:

```bash
npm install react-draggable
# or
yarn add react-draggable
```

## Usage

```
import React from 'react';
import DynamicResizer from './DynamicResizer';

const App = () => {
  return (
    <DynamicResizer
      direction="vertical" // or "horizontal"
      localKey="youKey"
    >
      <div>Top Section Content</div>
      <div>Bottom Section Content</div>
    </DynamicResizer>
  );
};

export default App;
```

## Vertical Example

```
<DynamicResizer
  direction="vertical"
  localKey="youKey"
>
	<div>Top Section Content</div>
  <div>Bottom Section Content</div>
</DynamicResizer>
```

### Horizontal Example

```
<DynamicResizer
  direction="horizontal"
  localKey="youKey"
>
	<div>Left Section Content</div>
  <div>Right Section Content</div>
</DynamicResizer>
```

## Props

| Prop              | Type                         | Default                  | Description                                                                       |
| ----------------- | ---------------------------- | ------------------------ | --------------------------------------------------------------------------------- |
| `direction `      | `horizontal` or `vertical`   | `vertical`               | Direction for resizing (horizontal or vertical).                                  |
| `minTopHeight`    | `number`                     | `10`                     | The minimum height of the top section (vertical mode).                            |
| `minBottomHeight` | `number`                     | `10`                     | The minimum height of the bottom section (vertical mode).                         |
| `minLeftWidth`    | `number`                     | `10`                     | The minimum width of the left section (horizontal mode).                          |
| `minRightWidth`   | `number`                     | `10`                     | The minimum width of the right section (horizontal mode).                         |
| `defaultWidth`    | `Number`                     | `10`                     | The default width of the resizable container (horizontal mode).                   |
| `defaultHeight`   | `number`                     | `10`                     | The default height of the resizable container (vertical mode).                    |
| `localKey`        | `string`                     | `dynamicResizerLocalKey` | Key for local storage to cache the size.                                          |
| `children`        | `ReactElement[]、 Element[]` | -                        | Two child elements (one for each section) wrapped inside the resizable container. |
| `enableEdges`     | `Array`                      | `['right', 'bottom']`    | Users can set dragging edges                                                      |
| `onResizeStart`   | `() => void`                 | -                        | Start dragging events                                                             |
| `onResize`        | `() => void`                 | -                        | dragging events                                                                   |
| `onResizeStop`    | `() => void`                 | -                        | Stop dragging events                                                              |

### Key Updates in v2.0

- **Resizable Direction**: Added support for both vertical and horizontal resizing.
- **Min Size Validation**: Improved the handling of minimum size constraints for both height and width.
- **Package update**: Replace react-draggable with re-resizable
- **Code extraction**: Extract tool related functions
