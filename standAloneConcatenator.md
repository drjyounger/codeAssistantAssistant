# Codebase Snapshot

Generated: 2025-01-24 13:21:03
Source: /Users/jamesyounger/Dropbox/TempStarsCoding/Staging-WIP/ReactCodeConcatenator

## Table of Contents

- .cursorrules
- README.md
- treeViewMigration.md
- package.json
- tsconfig.json
- nextSteps.md
- public/index.html
- public/manifest.json
- src/index.tsx
- src/App.tsx
- src/types.ts
- src/types/global.d.ts
- src/types/index.ts
- src/server/proxy.js
- src/server/package.json
- src/utils/helpers.ts
- src/utils/fileFormatter.ts
- src/components/FileTree.tsx
- src/components/FileConcatenationPage.tsx
- src/services/LocalFileService.ts
- src/services/FileService.ts

---

## File: .cursorrules (Cursorrules)

### This file describes the overall scope and intent of the codebase
```text
1. Project Overview
Goal: Assist a beginner developer to build a web application that presents a UI for local file and folder selection and then concatenates the files into one long markdown file that is easy to read. 

Because you are working with a beginner code, always be explicit and detailed about which files to change, how to change them, and where exactly the files are located.

The project is a React-based application that uses a web browser UI to select and concatenate files.

Selective File Concatenation - using a checkbox-based file directory tree navigation UI to navigate locally and select all the files that are relevant to the ticket and pull request. 
1.  Allow the user to enter a root directory path as a starting point
2.  Display the full file directory tree starting from the root directory, with checkboxes beside each file and subdirectory
3.  Allow selective checking of the boxes to include in the concatenation
4.  When checking the box beside a folder, it should include everything in that folder, including sub-folders and files
5. When "Next" is clicked, the system then concatenates all the selected files, according to the logic rules outlined in the program
6.  It should have an easy-to-use UI




```

---

## File: README.md

```text

```

---

## File: treeViewMigration.md

```text
Migration from v6 to v7
This guide describes the changes needed to migrate the Tree View from v6 to v7.
ads via Carbon
Start Your Web Dev Career! Learn JavaScript, CSS & more with Frontend Masters today!
ads via Carbon

Introduction

This is a reference guide for upgrading @mui/x-tree-view from v6 to v7. To read more about the changes from the new major, check out the blog post about the release of MUI X v7.

Start using the new release

In package.json, change the version of the Tree View package to ^7.0.0.

-"@mui/x-tree-view": "^6.0.0",
+"@mui/x-tree-view": "^7.0.0",

Copy
Update @mui/material package

To have the option of using the latest API from @mui/material, the package peer dependency version has been updated to ^5.15.14. It is a change in minor version only, so it should not cause any breaking changes. Please update your @mui/material package to this or a newer version.

Run codemods

The preset-safe codemod will automatically adjust the bulk of your code to account for breaking changes in v7. You can run v7.0.0/tree-view/preset-safe targeting only Tree View or v7.0.0/preset-safe to target other MUI X components like the Data Grid as well.

You can either run it on a specific file, folder, or your entire codebase when choosing the <path> argument.

// Tree View specific
npx @mui/x-codemod@latest v7.0.0/tree-view/preset-safe <path>

// Target other MUI X components as well
npx @mui/x-codemod@latest v7.0.0/preset-safe <path>

Copy
If you want to run the codemods one by one, check out the codemods included in the preset-safe codemod for the Tree View for more details.

Breaking changes that are handled by preset-safe codemod are denoted by a ✅ emoji in the table of contents on the right side of the screen or next to the specific point that is handled by it.

If you have already applied the v7.0.0/tree-view/preset-safe (or v7.0.0/preset-safe) codemod, then you should not need to take any further action on these items. If there's a specific part of the breaking change that is not part of the codemod or needs some manual work, it will be listed in the end of each section.

All other changes must be handled manually.

Not all use cases are covered by codemods. In some scenarios, like props spreading, cross-file dependencies, etc., the changes are not properly identified and therefore must be handled manually.

For example, if a codemod tries to rename a prop, but this prop is hidden with the spread operator, it won't be transformed as expected.

<RichTreeView {...newProps} />

Copy
After running the codemods, make sure to test your application and that you don't have any console errors.

Feel free to open an issue for support if you need help to proceed with your migration.

Breaking changes

Since v7 is a major release, it contains changes that affect the public API. These changes were done for consistency, improved stability and to make room for new features.

Drop the legacy bundle

The support for IE 11 has been removed from all MUI X packages. The legacy bundle that used to support old browsers like IE 11 is no longer included.

If you need support for IE 11, you will need to keep using the latest version of the v6 release.

Drop Webpack 4 support

Dropping old browsers support also means that we no longer transpile some features that are natively supported by modern browsers – like Nullish Coalescing and Optional Chaining.

These features are not supported by Webpack 4, so if you are using Webpack 4, you will need to transpile these features yourself or upgrade to Webpack 5.

Here is an example of how you can transpile these features on Webpack 4 using the @babel/preset-env preset:

 // webpack.config.js

 module.exports = (env) => ({
   // ...
   module: {
     rules: [
       {
         test: /\.[jt]sx?$/,
-        exclude: /node_modules/,
+        exclude: [
+          {
+            test: path.resolve(__dirname, 'node_modules'),
+            exclude: [path.resolve(__dirname, 'node_modules/@mui/x-tree-view')],
+          },
+        ],
       },
     ],
   },
 });

Copy
✅ Rename nodeId to itemId

The required nodeId prop used by the Tree Item has been renamed to itemId for consistency:

 <TreeView>
-  <TreeItem label="Item 1" nodeId="one">
+  <TreeItem label="Item 1" itemId="one">
 </TreeView>

Copy
The same change has been applied to the ContentComponent prop:

 const CustomContent = React.forwardRef((props, ref) => {
-  const id = props.nodeId;
+  const id = props.itemId;
   // Render some UI
 });

 function App() {
   return (
     <SimpleTreeView>
       <TreeItem ContentComponent={CustomContent} />
     </SimpleTreeView>
   )
 }

Copy
✅ Use Simple Tree View instead of Tree View

The <TreeView /> component has been deprecated and will be removed in the next major. You can start replacing it with the new <SimpleTreeView /> component which has exactly the same API:

-import { TreeView } from '@mui/x-tree-view';
+import { SimpleTreeView } from '@mui/x-tree-view';

-import { TreeView } from '@mui/x-tree-view/TreeView';
+import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';

   return (
-    <TreeView>
+    <SimpleTreeView>
       <TreeItem itemId="1" label="First item" />
-    </TreeView>
+    </SimpleTreeView>
   );

Copy
If you were using theme augmentation, you will also need to migrate it:

 const theme = createTheme({
   components: {
-    MuiTreeView: {
+    MuiSimpleTreeView: {
       styleOverrides: {
         root: {
           opacity: 0.5,
         },
       },
     },
   },
 });

Copy
If you were using the treeViewClasses object, you can replace it with the new simpleTreeViewClasses object:

 import { treeViewClasses } from '@mui/x-tree-view/TreeView';
 import { simpleTreeViewClasses } from '@mui/x-tree-view/SimpleTreeView';

-const rootClass = treeViewClasses.root;
+const rootClass = simpleTreeViewClasses.root;

Copy
Use slots to define the item icons

Define
expandIcon
The icon used to expand the children of an item (rendered when this item is collapsed) is now defined as a slot both on the <TreeView /> and the <TreeItem /> components.

If you were using the ChevronRight icon from @mui/icons-material, you can stop passing it to your component because it is now the default value:

-import ChevronRightIcon from '@mui/icons-material/ChevronRight';

 <SimpleTreeView
-  defaultExpandIcon={<ChevronRightIcon />}
 >
   {items}
 </SimpleTreeView>

Copy
If you were passing another icon to your Tree View component, you need to use the new expandIcon slot on this component:

 <SimpleTreeView
-  defaultExpandIcon={<MyCustomExpandIcon />}
+  slots={{ expandIcon: MyCustomExpandIcon }}
 >
   {items}
 </SimpleTreeView>

Copy
Note that the slots prop expects a React component, not the JSX element returned when rendering this component.

If you were passing another icon to your <TreeItem /> component, you need to use the new expandIcon slot on this component:

  <SimpleTreeView>
    <TreeItem
      itemId="1"
      label="Item 1"
-     expandIcon={<MyCustomExpandIcon />}
+     slots={{ expandIcon: MyCustomExpandIcon }}
    />
  </SimpleTreeView>

Copy
Define
collapseIcon
The icon used to collapse the children of an item (rendered when this item is expanded) is now defined as a slot both on the <TreeView /> and <TreeItem /> components.

If you were using the ExpandMore icon from @mui/icons-material, you can stop passing it to your component because it is now the default value:

- import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

  <SimpleTreeView
-   defaultCollapseIcon={<ExpandMoreIcon />}
  >
    {items}
  </SimpleTreeView>

Copy
If you were passing another icon to your Tree View component, you need to use the new collapseIcon slot on this component:

  <SimpleTreeView
-   defaultCollapseIcon={<MyCustomCollapseIcon />}
+   slots={{ collapseIcon: MyCustomCollapseIcon }}
  >
    {items}
  </SimpleTreeView>

Copy
Note that the slots prop expects a React component, not the JSX element returned when rendering this component.

If you were passing another icon to your <TreeItem /> component, you need to use the new collapseIcon slot on this component:

  <SimpleTreeView>
    <TreeItem
      itemId="1"
      label="Item 1"
-     collapseIcon={<MyCustomCollapseIcon />}
+     slots={{ collapseIcon: MyCustomCollapseIcon }}
    />
  </SimpleTreeView>

Copy
Replace
parentIcon
The parentIcon prop has been removed from the Tree View components.

If you were passing an icon to your Tree View component, you can achieve the same behavior by passing the same icon to both the collapseIcon and the expandIcon slots on this component:

  <SimpleTreeView
-   defaultParentIcon={<MyCustomParentIcon />}
+   slots={{ collapseIcon: MyCustomParentIcon, expandIcon: MyCustomParentIcon }}
  >
    {items}
  </SimpleTreeView>

Copy
Define
endIcon
The icon rendered next to an item without children is now defined as a slot both on the <TreeView /> and <TreeItem /> components.

If you were passing an icon to your Tree View component, you need to use the new endIcon slot on this component:

  <SimpleTreeView
-   defaultEndIcon={<MyCustomEndIcon />}
+   slots={{ endIcon: MyCustomEndIcon }}
  >
    {items}
  </SimpleTreeView>

Copy
Note that the slots prop expects a React component, not the JSX element returned when rendering this component.

If you were passing an icon to your <TreeItem /> component, you need to use the new endIcon slot on this component:

  <SimpleTreeView>
    <TreeItem
      itemId="1"
      label="Item 1"
-     endIcon={<MyCustomEndIcon />}
+     slots={{ endIcon: MyCustomEndIcon }}
    />
  </SimpleTreeView>

Copy
Define
icon
The icon rendered next to an item is now defined as a slot on the <TreeItem /> component.

If you were passing an icon to your <TreeItem /> component, you need to use the new icon slot on this component:

  <SimpleTreeView>
    <TreeItem
      itemId="1"
      label="Item 1"
-     icon={<MyCustomIcon />}
+     slots={{ icon: MyCustomIcon }}
    />
  </SimpleTreeView>

Copy
Note that the slots prop expects a React component, not the JSX element returned when rendering this component.

✅ Use slots to define the group transition

The component used to animate the item children is now defined as a slot on the <TreeItem /> component.

If you were passing a TransitionComponent or TransitionProps to your <TreeItem /> component, you need to use the new groupTransition slot on this component:

 <SimpleTreeView>
   <TreeItem
     itemId="1"
     label="Item 1"
-    TransitionComponent={Fade}
-    TransitionProps={{ timeout: 600 }}
+    slots={{ groupTransition: Fade }}
+    slotProps={{ groupTransition: { timeout: 600 } }}
   />
 </SimpleTreeView>

Copy
Rename the group class of the Tree Item component

The group class of the <TreeItem /> component has been renamed to groupTransition to match with its new slot name.

 const StyledTreeItem = styled(TreeItem)({
-  [`& .${treeItemClasses.group}`]: {
+  [`& .${treeItemClasses.groupTransition}`]: {
    marginLeft: 20,
  },
 });

Copy
✅ Rename onNodeToggle, expanded and defaultExpanded

The expansion props have been renamed to better describe their behaviors:

Old name	New name
onNodeToggle	onExpandedItemsChange
expanded	expandedItems
defaultExpanded	defaultExpandedItems
 <TreeView
-  onNodeToggle={handleExpansionChange}
+  onExpandedItemsChange={handleExpansionChange}

-  expanded={expandedItems}
+  expandedItems={expandedItems}

-  defaultExpanded={defaultExpandedItems}
+  defaultExpandedItems={defaultExpandedItems}
 />

Copy
If you were using the onNodeToggle prop to react to the expansion or collapse of a specific item, you can use the new onItemExpansionToggle prop which is called whenever an item is expanded or collapsed with its id and expansion status

// It is also available on the deprecated Tree View component
<SimpleTreeView
  onItemExpansionToggle={(event, itemId, isExpanded) =>
    console.log(itemId, isExpanded)
  }
/>

Copy
✅ Rename onNodeSelect, selected, and defaultSelected

The selection props have been renamed to better describe their behaviors:

Old name	New name
onNodeSelect	onSelectedItemsChange
selected	selectedItems
defaultSelected	defaultSelectedItems
 <TreeView
-  onNodeSelect={handleSelectionChange}
+  onSelectedItemsChange={handleSelectionChange}

-  selected={selectedItems}
+  selectedItems={selectedItems}

-  defaultSelected={defaultSelectedItems}
+  defaultSelectedItems={defaultSelectedItems}
 />

Copy
If you were using the onNodeSelect prop to react to the selection or deselection of a specific item, you can use the new onItemSelectionToggle prop which is called whenever an item is selected or deselected with its id and selection status.

// It is also available on the deprecated `<TreeView />` component
<SimpleTreeView
  onItemSelectionToggle={(event, itemId, isSelected) =>
    console.log(itemId, isSelected)
  }
/>

Copy
Focus the Tree Item instead of the Tree View

The focus is now applied to the Tree Item root element instead of the Tree View root element.

This change will allow new features that require the focus to be on the Tree Item, like the drag and drop reordering of items. It also solves several issues with focus management, like the inability to scroll to the focused item when a lot of items are rendered.

This will mostly impact how you write tests to interact with the Tree View:

For example, if you were writing a test with react-testing-library, here is what the changes could look like:

 it('test example on first item', () => {
   const { getByRole } = render(
     <SimpleTreeView>
       <TreeItem itemId="one" id="one">One</TreeItem>
       <TreeItem itemId="two" id="two">Two</TreeItem>
    </SimpleTreeView>
   );

   // Set the focus to the item "One"
-  const tree = getByRole('tree');
+  const treeItem = getByRole('treeitem', { name: 'One' });
   act(() => {
-    tree.focus();
+    treeItem.focus();
   });
-  fireEvent.keyDown(tree, { key: 'ArrowDown' });
+  fireEvent.keyDown(treeItem, { key: 'ArrowDown' });

  // Check if the new focused item is "Two"
- expect(tree)to.have.attribute('aria-activedescendant', 'two');
+ expect(document.activeElement).to.have.attribute('id', 'two');
 })

Copy
✅ Use useTreeItemState instead of useTreeItem

The useTreeItem hook has been renamed useTreeItemState. This will help create a new headless version of the Tree Item component based on a future useTreeItem hook.

-import { TreeItem, useTreeItem } from '@mui/x-tree-view/TreeItem';
+import { TreeItem, useTreeItemState } from '@mui/x-tree-view/TreeItem';

 const CustomContent = React.forwardRef((props, ref) => {
-  const { disabled } = useTreeItem(props.itemId);
+  const { disabled } = useTreeItemState(props.itemId);

   // Render some UI
 });

 function App() {
   return (
     <SimpleTreeView>
       <TreeItem ContentComponent={CustomContent} />
     </SimpleTreeView>
   )
 }

Copy
✅ Rename onNodeFocus

The onNodeFocus callback has been renamed to onItemFocus for consistency:

 <SimpleTreeView
-  onNodeFocus={onNodeFocus}
+  onItemFocus={onItemFocus}
 />
```

---

## File: package.json

```text
{
  "name": "file-concatenator",
  "version": "0.1.0",
  "private": true,
  "proxy": "http://localhost:3001",
  "dependencies": {
    "@emotion/react": "^11.11.3",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.15.3",
    "@mui/material": "^5.15.3",
    "@types/node": "^16.18.70",
    "@types/rc-tree": "^1.11.4",
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.18",
    "rc-tree": "^5.13.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "typescript": "^4.9.5"
  },
  "scripts": {
    "start": "react-scripts start",
    "server": "node src/server/proxy.js",
    "dev": "concurrently \"npm run start\" \"npm run server\"",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}

```

---

## File: tsconfig.json

```text
{
  "compilerOptions": {
    "target": "es2015",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}

```

---

## File: nextSteps.md

```text
I don't think it's recursively crawling and adding all files and sub-folders when a folder is checked off.  For example, I checked the 'src' folder which had hundreds of files in it, and it only added 6 or 7 files to the concatenation.

Below is an explanation of why checking a folder only yielded 6 or 7 files instead of the entire subtree, along with the changes needed so that when you check a folder, your code actually adds all the sub-files:

1. The Core Issue
Right now, your code only fetches one level of files in onCheck, because your getAllFilesInDirectory(...) call in FileTree.tsx does this:


// getAllFilesInDirectory is called with no "recursive" argument, so it's false by default
const filesInDir = await getAllFilesInDirectory(nodePath);
Then, in getAllFilesInDirectory, you have:


const resData = await response.json();

for (const item of resData.data) {
  if (item.isDirectory && recursive) {
    // Only if recursive === true do we dig deeper
    const subFiles = await getAllFilesInDirectory(item.id, recursive);
    ...
  } else if (!item.isDirectory) {
    files.push(item.id);
  }
}
But your call sets recursive to false by default—so it only grabs the immediate children, not sub-children. That’s why you only see 6 or 7 files: they’re the top-level files, ignoring any deeper subfolders.

We want: when a user checks a directory, you do a fully recursive traversal of that directory’s entire subtree, adding all text files. Otherwise, you’re just seeing the immediate children.

2. How to Fix: Make Directory Selection Recursive
Approach A: Make getAllFilesInDirectory always go recursive
If you want the user’s folder check to automatically add all subfiles, just remove the recursive parameter or set it to true by default:

Change your function signature:

- const getAllFilesInDirectory = async (dirPath: string, recursive: boolean = false): Promise<string[]> => {
+ const getAllFilesInDirectory = async (dirPath: string): Promise<string[]> => {
Remove or hardcode the recursion logic:

for (const item of resData.data) {
-  if (item.isDirectory && recursive) {
-    const subFiles = await getAllFilesInDirectory(item.id, recursive);
+  if (item.isDirectory) {
+    // always dig deeper
     const subFiles = await getAllFilesInDirectory(item.id);
     files = [...files, ...subFiles];
   } else if (!item.isDirectory) {
     files.push(item.id);
   }
}
After that, when you do


const filesInDir = await getAllFilesInDirectory(nodePath);
it will grab the entire subtree. That’s it—one line to remove the condition so that item.isDirectory always recurses.

Approach B: Provide a “recursive: true” Option
If you want partial or optional recursion, pass an argument:


const filesInDir = await getAllFilesInDirectory(nodePath, true);
// or user can decide, e.g. "Are you sure you want to select all subfolders?"
Then in the function:


const getAllFilesInDirectory = async (dirPath: string, recursive = false): Promise<string[]> => {
  // ...
  for (const item of resData.data) {
    if (item.isDirectory && recursive) {
      const subFiles = await getAllFilesInDirectory(item.id, true);
      files = [...files, ...subFiles];
    } else if (!item.isDirectory) {
      files.push(item.id);
    }
  }
  return files;
};
Then in onCheck:


if (node?.isDirectory) {
  const filesInDir = await getAllFilesInDirectory(nodePath, true);
  // ...
}
That ensures a fully recursive approach if you pass true. If you keep it as false, you only get one level.

3. Don’t Forget to Exclude Non-Text Files
You’re already filtering for text files with:


const textFiles = filesInDir.filter(file => isTextFile(file));
allFiles = [...allFiles, ...textFiles];
That’s fine. Just be aware that you also want to ensure that you do the recursion for directories before filtering, so you fetch subfolders.

4. Implementation Details
In FileTree.tsx:


// 1) Make the signature always do recursion:
const getAllFilesInDirectory = async (dirPath: string): Promise<string[]> => {
  try {
    const response = await fetch('/api/local/directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath: dirPath })
    });
    const resData = await response.json();
    if (!resData.success) throw new Error(resData.error);

    let files: string[] = [];
    for (const item of resData.data) {
      if (item.isDirectory) {
        // Always go deeper
        const subFiles = await getAllFilesInDirectory(item.id);
        files = files.concat(subFiles);
      } else {
        files.push(item.id);
      }
    }
    return files;
  } catch (err) {
    console.error('Error scanning directory:', err);
    return [];
  }
};
In onCheck:


// For directories, get all files recursively
const filesInDir = await getAllFilesInDirectory(nodePath);

// Then filter for text files
const textFiles = filesInDir.filter(file => isTextFile(file));
allFiles = [...allFiles, ...textFiles];
Now, if you check the src folder, it should:

Call getAllFilesInDirectory(src).
Recursively gather all subfolders and files in src.
Filter out non-text files (e.g. png, jpg, etc.).
Add them all to the final allFiles.
Result: you’ll get all sub-files under that folder.

5. Confirming the Flow
With these changes, as soon as you click a folder’s checkbox:

onCheck sees that folder is a directory in nodeMap[nodePath].
onCheck calls getAllFilesInDirectory(nodePath).
That function does a deep recursion:
For each subdirectory, call getAllFilesInDirectory again.
For each file, collect it.
Return the entire flatten list of files.
You then filter out non-text.
The rest go to onSelect(uniqueFiles), which your parent uses for the final concatenation.
6. Potential Performance Caution
For very large subtrees, that’s going to do a big synchronous recursion in the browser (multiple fetch calls). If that’s the desired approach (the user wants to check a big directory at once), it’s fine, but can be slow. Just be aware that you might want to confirm with the user: “This directory has 5000 subfiles; are you sure?” But that’s an optional improvement.

Conclusion
Summary:

When a user checks a folder, you want a fully recursive subfolder scan.
The existing code only fetches one level.
Remove the if (recursive) ... check or pass recursive = true.
Let getAllFilesInDirectory recursively call itself for all subdirectories.
Then filter out non-text, so you only end up with text-based files in the final list.
That’s all you need so that checking src/ or any folder automatically includes all files in that folder’s subtree.







```

---

## File: public/index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="AI Code Review Tool"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>AI Code Review</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html> 
```

---

## File: public/manifest.json

```text
{
  "short_name": "AI Code Review",
  "name": "AI Code Review Tool",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
} 
```

---

## File: src/index.tsx

```text
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

```

---

## File: src/App.tsx

```text
import React from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import FileConcatenationPage from './components/FileConcatenationPage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <FileConcatenationPage />
    </ThemeProvider>
  );
};

export default App;

```

---

## File: src/types.ts

```typescript
export interface FileNode {
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export interface TreeNode {
  id: string;
  name: string;
  isDirectory: boolean;
  children?: TreeNode[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProcessingStats {
  processedFiles: number;
  ignoredFiles: number;
  skippedDirs: number;
  errors: number;
  totalTokens: number;
} 
```

---

## File: src/types/global.d.ts

```typescript

```

---

## File: src/types/index.ts

```typescript
// Jira related types
export interface JiraTicket {
  key: string;
  summary: string;
  description: string;
}

// GitHub related types
export interface GitHubFile {
  filename: string;
  status: 'added' | 'modified' | 'removed';
  patch: string | undefined;
}

export interface GitHubPR {
  title: string;
  description: string;
  number: number;
  repo: {
    owner: string;
    name: string;
  };
  changedFiles: GitHubFile[];
  author?: string;
  createdAt?: string;
  isMerged?: boolean;
  mergeable?: boolean;
  labels?: string[];
}

export interface PRDetails {
  frontend: GitHubPR | null;
  backend: GitHubPR | null;
}

// File selection types
export interface FileNode {
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

// Review context types
export interface ReviewContext {
  jiraTicket: JiraTicket | null;
  githubPR: GitHubPR | null;
  selectedFiles: string[];
  additionalFiles: string[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TreeNode {
  id: string;
  name: string;
  isDirectory: boolean;
  children?: TreeNode[];
} 
```

---

## File: src/server/proxy.js

```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
app.use(cors());
app.use(express.json());

// Add this constant at the top of the file
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.py', '.js', '.html', '.css', '.json', '.xml', '.yaml', '.yml',
  '.sh', '.bat', '.ps1', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php',
  '.rb', '.go', '.rs', '.ts', '.jsx', '.tsx', '.vue', '.scala', '.kt', '.groovy',
  '.gradle', '.sql', '.gitignore', '.env', '.cfg', '.ini', '.toml', '.csv'
]);

// Add this helper function
function isTextFile(filename) {
  // Special case for .cursorrules
  if (filename === '.cursorrules') {
    return true;
  }
  const ext = path.extname(filename).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

// Replace the existing readDirRecursive function with this non-recursive version
async function readDir(dirPath) {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const results = items
      // Update filter to include text file check
      .filter(item => {
        if (item.isDirectory()) {
          return !['node_modules', '.git', '.next', 'dist', 'build'].includes(item.name);
        }
        // Only include text files
        return isTextFile(item.name);
      })
      .map((item) => {
        const fullPath = path.join(dirPath, item.name);
        return {
          id: fullPath,
          name: item.name,
          isDirectory: item.isDirectory(),
        };
      });
    
    // Add logging to help debug
    console.log(`Successfully processed ${results.length} items in ${dirPath}`);
    return results;
  } catch (error) {
    console.error('Error in readDir:', {
      path: dirPath,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Add this new recursive function
async function readDirRecursive(dirPath) {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    let results = [];
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      // Skip excluded directories
      if (item.isDirectory() && ['node_modules', '.git', '.next', 'dist', 'build'].includes(item.name)) {
        continue;
      }

      if (item.isDirectory()) {
        // Recursively get contents of subdirectories
        const subDirResults = await readDirRecursive(fullPath);
        results = results.concat(subDirResults);
      } else if (isTextFile(item.name)) {
        // Only add text files
        results.push({
          id: fullPath,
          name: item.name,
          isDirectory: false
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in readDirRecursive:', {
      path: dirPath,
      error: error.message
    });
    throw error;
  }
}

// Simplified path safety check that allows project directories
function isPathSafe(filePath) {
  const normalizedPath = path.normalize(filePath);
  
  // Block access to obviously sensitive paths
  const dangerousPatterns = [
    /\/\.ssh\//,
    /\/\.aws\//,
    /\/\.config\//,
    /\/\.bash_history/,
    /\/\.env$/,
    /\/\.env\./,
    /password/i,
    /secret/i,
  ];

  // Allow specific project directories
  const allowedPaths = [
    '/Users/jamesyounger/Dropbox/TempStarsCoding',
    '/Users/jamesyounger/Dropbox/TempStarsCoding/TempStarsApp'
  ];

  // Check if path is in allowed paths
  if (allowedPaths.some(allowedPath => normalizedPath.startsWith(allowedPath))) {
    return true;
  }

  // Check if path contains dangerous patterns
  if (dangerousPatterns.some(pattern => pattern.test(normalizedPath))) {
    console.log('Blocked access to sensitive path:', normalizedPath);
    return false;
  }

  // By default, be restrictive
  console.log('Path not explicitly allowed:', normalizedPath);
  return false;
}

// Directory listing endpoint
app.post('/api/local/directory', async (req, res) => {
  try {
    const { folderPath, recursive } = req.body;
    if (!folderPath) {
      return res.status(400).json({ 
        success: false, 
        error: 'No folderPath provided' 
      });
    }

    const absolutePath = path.resolve(folderPath);
    console.log('Attempting to read path:', absolutePath);

    if (!isPathSafe(absolutePath)) {
      console.log('Access denied:', absolutePath);
      return res.status(403).json({ 
        success: false, 
        error: 'Access not allowed for security reasons' 
      });
    }

    // Check if path exists and is readable
    try {
      await fs.access(absolutePath, fs.constants.R_OK);
    } catch (error) {
      console.log('Access error:', error);
      return res.status(403).json({
        success: false,
        error: `Cannot access path: ${error.message}`
      });
    }

    // Check if path is a directory or file
    const stats = await fs.stat(absolutePath);
    
    if (stats.isDirectory()) {
      // Use recursive function if recursive flag is true
      const children = recursive ? 
        await readDirRecursive(absolutePath) :
        await readDir(absolutePath);
      
      return res.json({ 
        success: true, 
        data: children,
        type: 'directory'
      });
    } else {
      // If it's a file, return it as a leaf node
      return res.json({
        success: true,
        data: [{
          id: absolutePath,
          name: path.basename(absolutePath),
          isDirectory: false
        }],
        type: 'file'
      });
    }
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    return res.status(500).json({ 
      success: false, 
      error: `Failed to read path: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// File reading endpoint
app.post('/api/local/file', async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ 
        success: false, 
        error: 'No filePath provided' 
      });
    }

    const absolutePath = path.resolve(filePath);
    
    // Add check for text file
    if (!isTextFile(path.basename(absolutePath))) {
      return res.status(400).json({
        success: false,
        error: 'Not a valid text file'
      });
    }

    if (!isPathSafe(absolutePath)) {
      console.log('File access denied:', absolutePath);
      return res.status(403).json({ 
        success: false, 
        error: 'File access not allowed for security reasons' 
      });
    }

    // Check if file exists and is readable
    try {
      await fs.access(absolutePath, fs.constants.R_OK);
    } catch (error) {
      console.log('File access error:', error);
      return res.status(403).json({
        success: false,
        error: `Cannot access file: ${error.message}`
      });
    }

    // Check if path is a directory
    const stats = await fs.stat(absolutePath);
    if (stats.isDirectory()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot read a directory as a file'
      });
    }

    const content = await fs.readFile(absolutePath, 'utf8');
    console.log('Successfully read file:', absolutePath);
    res.json({ success: true, content });
  } catch (error) {
    console.error('File reading error:', error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to read file: ${error.message}` 
    });
  }
});

const PORT = process.env.REACT_APP_SERVER_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Server is allowing access to project directories');
}); 
```

---

## File: src/server/package.json

```text
{
  "name": "server",
  "version": "1.0.0",
  "main": "proxy.js",
  "scripts": {
    "start": "node proxy.js",
    "dev": "nodemon proxy.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "axios": "^1.7.9",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}

```

---

## File: src/utils/helpers.ts

```typescript
export {};

```

---

## File: src/utils/fileFormatter.ts

```typescript
interface TableOfContentsEntry {
  path: string;
  lineNumber: number;
}

export const formatConcatenatedFiles = async (
  selectedFiles: string[],
  getFileContent: (path: string) => Promise<string>
): Promise<string> => {
  const tableOfContents: TableOfContentsEntry[] = [];
  let concatenatedContent = '';
  let currentLine = 1;

  // Generate table of contents header
  concatenatedContent += '# This is one large file that contains many files concatenated together.  The file starts with a Table of Contents for this file, which lists every file in that was concatenated along with the file paths.  The table of contents ends with "----", after which you will find the actual file contents, with each file starting with "## File {#}":\n\n';

  // First pass: build table of contents
  for (const filePath of selectedFiles) {
    const entry: TableOfContentsEntry = {
      path: filePath,
      lineNumber: currentLine
    };
    tableOfContents.push(entry);
    
    // Add entry to table of contents
    concatenatedContent += `${tableOfContents.length}. [${filePath}](#file-${tableOfContents.length})\n`;
  }

  concatenatedContent += '\n---\n\n';

  // Second pass: add file contents
  for (let i = 0; i < selectedFiles.length; i++) {
    const filePath = selectedFiles[i];
    let content = await getFileContent(filePath);

    // Mask sensitive data in .env files
    if (filePath.endsWith('.env')) {
      content = maskEnvContent(content);
    }

    // Add file header with full path
    concatenatedContent += `\n\n## File ${i + 1}: \`${filePath}\`\n\n`;
    
    // Add code fence with appropriate language
    const language = getLanguageFromExtension(filePath);
    concatenatedContent += '```' + language + '\n';
    concatenatedContent += content;
    
    // Ensure content ends with newline before closing fence
    if (!content.endsWith('\n')) {
      concatenatedContent += '\n';
    }
    concatenatedContent += '```\n\n';
    concatenatedContent += '---\n';

    // Update current line count for next file
    currentLine += content.split('\n').length + 6; // +6 for the added markdown formatting lines
  }

  return concatenatedContent;
};

const maskEnvContent = (content: string): string => {
  return content.replace(
    /^([A-Za-z0-9_]+)[\s=]+['"]?([^'"\n]+)['"]?$/gm,
    (match, key, value) => {
      const sensitivePatterns = [
        /key/i,
        /token/i,
        /secret/i,
        /password/i,
        /auth/i,
        /pwd/i,
        /credential/i
      ];
      
      if (sensitivePatterns.some(pattern => pattern.test(key))) {
        return `${key}=[MASKED]`;
      }
      return match;
    }
  );
};

const getLanguageFromExtension = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'rb': 'ruby',
    'php': 'php',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'json': 'json',
    'yml': 'yaml',
    'yaml': 'yaml',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'bash',
    'bash': 'bash',
    'txt': 'plaintext',
    'xml': 'xml',
    'dockerfile': 'dockerfile',
    'gitignore': 'plaintext',
    'env': 'plaintext'
  };

  return languageMap[ext] || 'plaintext';
}; 
```

---

## File: src/components/FileTree.tsx

```text
// src/components/FileTree.tsx

import React, { useEffect, useState } from 'react';
import type { DataNode } from 'rc-tree/lib/interface';
import Tree from 'rc-tree';
import type { Key } from 'rc-tree/lib/interface';
import 'rc-tree/assets/index.css';
import { Box } from '@mui/material';

interface ServerNode {
  id: string;
  name: string;
  isDirectory: boolean;
}

interface FileTreeProps {
  rootPath: string;
  onSelect: (paths: string[]) => void;
  onError: (err: Error) => void;
}

interface NodeMap {
  [key: string]: {
    isDirectory: boolean;
    children: string[];
  };
}

// Add these constants
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.py', '.js', '.html', '.css', '.json', '.xml', '.yaml', '.yml',
  '.sh', '.bat', '.ps1', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php',
  '.rb', '.go', '.rs', '.ts', '.jsx', '.tsx', '.vue', '.scala', '.kt', '.groovy',
  '.gradle', '.sql', '.gitignore', '.env', '.cfg', '.ini', '.toml', '.csv'
]);

const isTextFile = (filename: string): boolean => {
  if (filename === '.cursorrules') return true;
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
};

const FileTree: React.FC<FileTreeProps> = ({ rootPath, onSelect, onError }) => {
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
  const [nodeMap, setNodeMap] = useState<NodeMap>({});

  useEffect(() => {
    if (!rootPath) return;
    loadDirectory(rootPath, true);
  }, [rootPath]);

  const loadDirectory = async (dirPath: string, isRoot: boolean = false) => {
    try {
      const response = await fetch('/api/local/directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: dirPath })
      });
      const resData = await response.json();
      
      if (!resData.success) throw new Error(resData.error);
      
      const newData = convertToRcTreeData(resData.data);
      
      // Update node map
      const newNodeMap = { ...nodeMap };
      resData.data.forEach((node: ServerNode) => {
        newNodeMap[node.id] = {
          isDirectory: node.isDirectory,
          children: []
        };
      });
      setNodeMap(newNodeMap);

      if (isRoot) {
        setTreeData(newData);
      } else {
        setTreeData(updateTreeDataWithChildren(treeData, dirPath, newData));
      }
    } catch (err) {
      onError(err instanceof Error ? err : new Error('Failed to load directory'));
    }
  };

  const getAllFilesInDirectory = async (dirPath: string): Promise<string[]> => {
    try {
      const response = await fetch('/api/local/directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          folderPath: dirPath,
          recursive: true  // Always request recursive listing
        })
      });
      
      const resData = await response.json();
      if (!resData.success) throw new Error(resData.error);

      // Since we're getting all files recursively from the server,
      // we can simply return the file paths
      return resData.data
        .filter((item: ServerNode) => !item.isDirectory)
        .map((item: ServerNode) => item.id);
    } catch (err) {
      console.error('Error scanning directory:', err);
      return [];
    }
  };

  const updateTreeDataWithChildren = (
    data: DataNode[],
    parentKey: string,
    children: DataNode[]
  ): DataNode[] => {
    return data.map(node => {
      if (node.key === parentKey) {
        return { ...node, children };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeDataWithChildren(node.children, parentKey, children)
        };
      }
      return node;
    });
  };

  const convertToRcTreeData = (nodes: ServerNode[]): DataNode[] => {
    return nodes.map((item) => ({
      key: item.id,
      title: item.name,
      isLeaf: !item.isDirectory,
      children: item.isDirectory ? [] : undefined
    }));
  };

  const onLoadData = async (treeNode: DataNode) => {
    if (treeNode.isLeaf || (treeNode.children && treeNode.children.length > 0)) {
      return Promise.resolve();
    }
    return loadDirectory(treeNode.key as string);
  };

  const onCheck = async (checkedKeys: Key[] | { checked: Key[]; halfChecked: Key[] }) => {
    const checked = Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked;
    let allFiles: string[] = [];

    for (const key of checked) {
      const nodePath = key.toString();
      const node = nodeMap[nodePath];

      if (node?.isDirectory) {
        // Get all files recursively
        const filesInDir = await getAllFilesInDirectory(nodePath);
        allFiles = [...allFiles, ...filesInDir];
      } else if (isTextFile(nodePath)) {
        allFiles.push(nodePath);
      }
    }

    // Remove duplicates and notify parent
    const uniqueFiles = Array.from(new Set(allFiles));
    onSelect(uniqueFiles);
  };

  const onExpand = (expandedKeys: Key[]) => {
    setExpandedKeys(expandedKeys);
  };

  return (
    <Box sx={{ maxHeight: '60vh', overflow: 'auto', bgcolor: 'background.paper' }}>
      <Tree
        checkable
        treeData={treeData}
        loadData={onLoadData}
        onCheck={onCheck}
        onExpand={onExpand}
        expandedKeys={expandedKeys}
        defaultExpandAll={false}
        autoExpandParent={true}
        checkStrictly={false} // This enables parent-child checkbox relationship
      />
    </Box>
  );
};

export default FileTree;

```

---

## File: src/components/FileConcatenationPage.tsx

```text
import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import FileTree from './FileTree';
import { formatConcatenatedFiles } from '../utils/fileFormatter';

const FileConcatenationPage: React.FC = () => {
  const [rootPath, setRootPath] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [concatenatedContent, setConcatenatedContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBrowse = () => {
    if (!rootPath.trim()) {
      setError('Please enter a valid path');
      return;
    }
    setError(null);
  };

  const handleFileSelect = async (paths: string[]) => {
    setIsProcessing(true);
    try {
      let allFiles: string[] = [];
      for (const path of paths) {
        try {
          const response = await fetch('/api/local/directory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folderPath: path })
          });
          const data = await response.json();
          
          if (data.success) {
            if (data.data && data.data.length > 0) {
              const files = data.data
                .filter((item: any) => !item.isDirectory)
                .map((item: any) => item.id);
              allFiles = [...allFiles, ...files];
            } else {
              allFiles.push(path);
            }
          }
        } catch (err) {
          console.error(`Error processing path ${path}:`, err);
        }
      }
      
      const uniqueFiles = Array.from(new Set(allFiles));
      setSelectedFiles(uniqueFiles);
      
      if (uniqueFiles.length === 0) {
        setError('No files found in selected paths');
      } else {
        setError(null);
      }
    } catch (err) {
      setError('Error processing selected paths');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConcatenate = async () => {
    if (selectedFiles.length === 0) {
      setError('No files selected');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const getFileContent = async (path: string): Promise<string> => {
        const response = await fetch('/api/local/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: path })
        });
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to read file');
        }
        return data.content;
      };

      const formattedContent = await formatConcatenatedFiles(selectedFiles, getFileContent);
      setConcatenatedContent(formattedContent);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to concatenate files');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!concatenatedContent) return;
    
    const blob = new Blob([concatenatedContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'concatenated-files.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          File Concatenation Tool
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Root Directory Path
          </Typography>
          <TextField
            fullWidth
            value={rootPath}
            onChange={(e) => setRootPath(e.target.value)}
            placeholder="/path/to/your/project"
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleBrowse}
            disabled={loading || !rootPath.trim()}
          >
            Browse Files
          </Button>
        </Box>

        {rootPath && (
          <Box sx={{ mb: 3 }}>
            <FileTree
              rootPath={rootPath}
              onSelect={handleFileSelect}
              onError={(err) => setError(err.message)}
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 3, mt: 2 }}>
          <Button
            variant="contained"
            onClick={handleConcatenate}
            disabled={loading || isProcessing || selectedFiles.length === 0}
          >
            {loading || isProcessing ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                {loading ? 'Concatenating...' : 'Processing Selection...'}
              </Box>
            ) : (
              'Concatenate Files'
            )}
          </Button>

          {concatenatedContent && (
            <Button
              variant="outlined"
              onClick={handleDownload}
              disabled={loading || isProcessing}
            >
              Download Markdown
            </Button>
          )}
        </Box>

        {concatenatedContent && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Preview
            </Typography>
            <Paper
              sx={{
                p: 2,
                maxHeight: '50vh',
                overflow: 'auto',
                backgroundColor: '#f5f5f5'
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {concatenatedContent}
              </pre>
            </Paper>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default FileConcatenationPage; 
```

---

## File: src/services/LocalFileService.ts

```typescript
// src/services/LocalFileService.ts

import { FileNode } from '../types';

interface DirectoryResponse {
    path: string;
    type: 'file' | 'directory';
    children?: DirectoryResponse[];
  }
  
  /**
   * getLocalDirectoryTree
   * Sends a POST to /api/local/directory with { rootPath }
   * Expects a recursive JSON describing folder contents
   */
  export const getLocalDirectoryTree = async (rootPath: string): Promise<DirectoryResponse> => {
    try {
      console.log('Attempting to read directory:', rootPath);
      
      const response = await fetch('/api/local/directory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rootPath }),
      });
  
      // Get the response text first
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('Server response:', responseText);
        throw new Error(`Failed to read local directory: ${responseText}`);
      }
  
      // Try to parse the response as JSON
      try {
        const data = JSON.parse(responseText);
        
        // Validate the response structure
        if (!data || typeof data !== 'object' || !data.path) {
          throw new Error('Invalid directory response format');
        }
        
        return data;
      } catch (parseError) {
        console.error('Failed to parse server response:', responseText);
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      console.error('Error in getLocalDirectoryTree:', error);
      throw error;
    }
  };
  
  /**
   * readLocalFile
   * Sends a POST to /api/local/file with { filePath }
   * Returns file content as text
   */
  export const readLocalFile = async (filePath: string): Promise<{ success: boolean; content?: string; error?: string }> => {
    const response = await fetch('/api/local/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath })
    });
    return response.json();
  };
  
  const API_BASE_URL = 'http://localhost:3001/api';
  
  export interface TreeNode {
    id: string;
    name: string;
    isDirectory: boolean;
    children?: TreeNode[];
  }
  
  export const readDirectoryLevel = async (folderPath: string): Promise<{ success: boolean; data?: TreeNode[]; error?: string }> => {
    const response = await fetch('/api/local/directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath })
    });
    return response.json();
  };
  
```

---

## File: src/services/FileService.ts

```typescript
// src/services/FileService.ts

import { FileNode, ApiResponse } from '../types/index';
import {
  getLocalDirectoryTree,
  readLocalFile,
} from './LocalFileService';

interface ProcessingStats {
  processedFiles: number;
  ignoredFiles: number;
  skippedDirs: number;
  errors: number;
  totalTokens: number;
}

/**
 * Directories or subdirectories to ignore
 */
const STANDARD_DIRS = new Set([
  'venv', '__pycache__', 'node_modules', 'lib', 'site-packages',
  'dist', 'build', 'env', '.git', '.idea', '.vscode', '.svn', 'vendor'
]);

/**
 * File extensions considered "text" for concatenation
 */
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.py', '.js', '.html', '.css', '.json', '.xml',
  '.yaml', '.yml', '.sh', '.bat', '.ps1', '.java', '.c', '.cpp',
  '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.ts', '.jsx',
  '.tsx', '.vue', '.scala', '.kt', '.groovy', '.gradle', '.sql',
  '.gitignore', '.env', '.cfg', '.ini', '.toml', '.csv'
]);

/**
 * Helper to decide if a given file is textual
 */
export const isTextFile = (filename: string): boolean => {
  if (filename === '.cursorrules') return true;
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
};

/**
 * Helper to skip "standard" directories
 */
export const isStandardLibraryPath = (path: string): boolean => {
  return Array.from(STANDARD_DIRS).some((dir) =>
    path.toLowerCase().includes(`/${dir.toLowerCase()}/`)
  );
};

/**
 * Map file extensions to syntax highlights (for the Markdown code fence)
 */
export const getLanguageFromExtension = (filename: string): string => {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  const languageMap: Record<string, string> = {
    '.py': 'python',
    '.js': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.jsx': 'javascript',
    '.html': 'html',
    '.css': 'css',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.rb': 'ruby',
    '.php': 'php',
    '.go': 'go',
    '.rs': 'rust',
    '.sql': 'sql',
  };
  return languageMap[ext] || 'text';
};

/**
 * Estimate tokens in text using a simple approximation
 */
const estimateTokens = (text: string): number => {
  // Rough estimation: average English word is 4.7 characters
  // GPT tokens are roughly 4 characters per token
  return Math.ceil(text.length / 4);
};

/**
 * Process .env file content to mask sensitive values
 */
const maskEnvFileContent = (content: string): string => {
  // Mask sensitive values in .env files
  if (!content) return content;
  
  return content.replace(
    /^([A-Za-z0-9_]+)[\s=]+['"]?([^'"\n]+)['"]?$/gm,
    (_, key, value) => {
      if (key.toLowerCase().includes('key') || 
          key.toLowerCase().includes('token') || 
          key.toLowerCase().includes('secret') || 
          key.toLowerCase().includes('password')) {
        return `${key}=[MASKED]`;
      }
      return `${key}=${value}`;
    }
  );
};

/**
 * getDirectoryTree
 * Recursively fetches a local directory tree, then converts it
 * into a FileNode structure, skipping standard directories.
 */
export const getDirectoryTree = async (rootPath: string): Promise<FileNode> => {
  try {
    const normalizedPath = rootPath.trim();
    if (!normalizedPath) {
      throw new Error('Root path cannot be empty');
    }

    console.log('Attempting to fetch directory tree for:', normalizedPath);
    
    const rawTree = await getLocalDirectoryTree(normalizedPath);
    
    if (!rawTree || typeof rawTree !== 'object') {
      throw new Error('Invalid directory tree response');
    }

    const buildTree = (entry: any): FileNode | null => {
      if (!entry || !entry.path) {
        return null;
      }

      if (isStandardLibraryPath(entry.path)) {
        return null;
      }

      const node: FileNode = {
        path: entry.path,
        type: entry.type,
        children: [],
      };

      if (entry.type === 'directory' && entry.children) {
        for (const child of entry.children) {
          const childNode = buildTree(child);
          if (childNode) {
            node.children?.push(childNode);
          }
        }
      }
      return node;
    };

    const treeNode = buildTree(rawTree);
    if (!treeNode) {
      throw new Error('Root directory is excluded or invalid');
    }
    return treeNode;
  } catch (error) {
    console.error('Error in getDirectoryTree:', error);
    throw error;
  }
};

interface FileServiceResponse {
  success: boolean;
  data?: string;
  error?: string;
}

const IGNORED_FILE_TYPES = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico',
  '.mp3', '.mp4', '.wav', '.avi', '.mov',
  '.zip', '.tar', '.gz', '.rar',
  '.exe', '.dll', '.so', '.dylib',
  '.pyc', '.class'
]);

/**
 * concatenateFiles
 * Enhanced version matching Python script functionality
 */
export const concatenateFiles = async (
  filePaths: string[],
  rootPath: string
): Promise<FileServiceResponse> => {
  try {
    const stats: ProcessingStats = {
      processedFiles: 0,
      ignoredFiles: 0,
      skippedDirs: 0,
      errors: 0,
      totalTokens: 0
    };

    let concatenated = '# Codebase Snapshot\n\n';

    // Generate table of contents
    concatenated += '## Table of Contents\n\n';
    filePaths.forEach(path => {
      const relativePath = path.replace(rootPath, '').replace(/^\//, '');
      concatenated += `- ${relativePath}\n`;
    });
    concatenated += '\n---\n\n';

    // Process each file
    for (const filePath of filePaths) {
      try {
        const extension = filePath.slice(filePath.lastIndexOf('.'));
        
        // Skip binary and other ignored file types
        if (IGNORED_FILE_TYPES.has(extension.toLowerCase())) {
          stats.ignoredFiles++;
          continue;
        }

        const response = await readLocalFile(filePath);
        if (!response.success || !response.content) {
          throw new Error(response.error || 'Failed to read file');
        }

        const relativePath = filePath.replace(rootPath, '').replace(/^\//, '');
        let content = response.content;

        // Apply .env masking if needed
        if (filePath.endsWith('.env') || filePath.includes('.env.')) {
          content = maskEnvFileContent(content);
        }

        // Add file header and content
        concatenated += `## File: ${relativePath}\n\n\`\`\`${extension}\n${content}\n\`\`\`\n\n`;
        
        stats.processedFiles++;
        stats.totalTokens += estimateTokens(content);
      } catch (err) {
        stats.errors++;
        console.error(`Error processing file ${filePath}:`, err);
      }
    }

    // Add processing statistics
    concatenated += '## Processing Statistics\n\n';
    concatenated += `- Files processed: ${stats.processedFiles}\n`;
    concatenated += `- Files ignored: ${stats.ignoredFiles}\n`;
    concatenated += `- Directories skipped: ${stats.skippedDirs}\n`;
    concatenated += `- Errors encountered: ${stats.errors}\n`;
    concatenated += `- Estimated tokens: ${stats.totalTokens.toLocaleString()}\n`;

    return {
      success: true,
      data: concatenated
    };
  } catch (err) {
    console.error('Error in concatenateFiles:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to concatenate files'
    };
  }
};

```

---

