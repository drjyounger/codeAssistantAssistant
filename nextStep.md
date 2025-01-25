We are updating the way the file concatenation is done.  The current version is too slow and doesn't handle folders that contain a lot of files.  The updated version removes the MUI-based FileTree.tsx in favour of a recursive tree that uses rc-tree.  This allows for a more efficient file selection and concatenation process.

The replacement of the concatenation method is almost done but there are a few more steps to ensure it works completely:

The small bug is that, when viewing the tree of the files and folders for selection to be concatenated, the checkboxes don't show as selected when I check the box, and only one file is concatenated.

Currently:

The file directory tree is visible with checkboxes
I can click a "+" symbol to expand
When I click on a checkbox, no check appears in the box
When I click on multiple files, only the most recent file is included in the concatenation (not multiple files)

Expected:

The file directory tree is visible with checkboxes
I can click a "+" symbol to expand
When I click on a checkbox, there is a check in the box
When I click on multiple files, all files are checked and all checked files are included in the concatenation.


Why the Checkboxes Don’t Show a Check
By default, rc-tree is an uncontrolled component for checking. If you only provide onCheck but never tell the tree what keys are checked, the UI can’t display which nodes are checked.
In rc-tree, you must store the user’s checked keys in your own state and pass them back to the tree via a checkedKeys prop.
Currently, you have:

<Tree
  checkable
  treeData={treeData}
  onCheck={onCheck} // <-- You have a callback
  // no checkedKeys or defaultCheckedKeys, so it won't reflect the state
  ...
/>
When the user clicks a checkbox, onCheck is called, but rc-tree does not know to keep the box visually checked unless you supply checkedKeys={someStateValue} that you update in onCheck.

Why Only One File Is Included
Your onCheck is an async function that (for every newly checked node) calls getAllFilesInDirectory(...) and then onSelect(uniqueFiles).
If the user clicks multiple boxes, the checkedKeys array might only contain that new box’s key in the immediate event. Because you do not store the entire list of all previously selected boxes in local state, you’re effectively retrieving only the final node’s files.
How to Fix It
1. Add Local State for checkedKeys
In src/components/FileTree.tsx, define:


// Store the currently checked keys
const [checkedKeysState, setCheckedKeysState] = useState<Key[]>([]);
2. Pass It to <Tree>

<Tree
  checkable
  treeData={treeData}
  checkedKeys={checkedKeysState}  // <-- pass the checked keys state
  onCheck={onCheck}
  onExpand={onExpand}
  expandedKeys={expandedKeys}
  ...
/>
3. Update It in onCheck
In your existing onCheck function, do something like this:


const onCheck = async (
  checkedKeysParam: Key[] | { checked: Key[]; halfChecked: Key[] }
) => {
  // 1) Figure out the new array of checked keys
  const newChecked = Array.isArray(checkedKeysParam)
    ? checkedKeysParam
    : checkedKeysParam.checked;

  // 2) Update our local state, so the checkboxes show as checked
  setCheckedKeysState(newChecked);

  // 3) Now gather all files for all checked keys
  let allFiles: string[] = [];
  for (const key of newChecked) {
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

  // 4) Remove duplicates, pass them upward
  const uniqueFiles = Array.from(new Set(allFiles));
  onSelect(uniqueFiles);
};
Important: We always do setCheckedKeysState(newChecked) so the tree will render checks in the boxes. That’s what tells rc-tree “these are the nodes that should be visually checked.”

4. Remove the Old checkStrictly={false} if You Actually Want Folder/Child Auto-Check
If you need hierarchical checking (i.e., when you check a folder, it checks children, and partially-checked states show), it might actually be checkStrictly={false} or true depending on your preference.
checkStrictly={false} is typical for “hierarchical checking.”
checkStrictly={true} means each node is independent.
Double-check which behavior you want.
Putting It All Together
Below is a diff example of how src/components/FileTree.tsx might look with the fix. Focus on the checkedKeysState usage:


// src/components/FileTree.tsx

import React, { useEffect, useState } from 'react';
import Tree from 'rc-tree';
import type { DataNode, Key } from 'rc-tree/lib/interface';
import 'rc-tree/assets/index.css';
import { Box } from '@mui/material';
import { isTextFile } from '../services/FileService';

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

const getAllFilesInDirectory = async (dirPath: string): Promise<string[]> => {
  // same code as you already have...
};

export const FileTree: React.FC<FileTreeProps> = ({
  rootPath,
  onSelect,
  onError
}) => {
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
  const [nodeMap, setNodeMap] = useState<Record<string, { isDirectory: boolean }>>({});

+ // ADDED: local state for which keys are checked
+ const [checkedKeysState, setCheckedKeysState] = useState<Key[]>([]);

  useEffect(() => {
    // same code as you already have...
  }, [rootPath, onError]);

- const onCheck = async (checkedKeys: Key[] | { checked: Key[]; halfChecked: Key[] }) => {
-   const checked = Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked;
+ const onCheck = async (
+   checkedKeysParam: Key[] | { checked: Key[]; halfChecked: Key[] }
+ ) => {
+   // 1) unify the param
+   const newChecked = Array.isArray(checkedKeysParam)
+     ? checkedKeysParam
+     : checkedKeysParam.checked;

+   // 2) update local state so rc-tree shows the checkboxes
+   setCheckedKeysState(newChecked);

    let allFiles: string[] = [];

-   for (const key of checked) {
+   for (const key of newChecked) {
      const nodePath = key.toString();
      const node = nodeMap[nodePath];

      if (node?.isDirectory) {
        const filesInDir = await getAllFilesInDirectory(nodePath);
        allFiles = [...allFiles, ...filesInDir];
      } else if (isTextFile(nodePath)) {
        allFiles.push(nodePath);
      }
    }

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
        // Provide the keys we have checked in state
+       checkedKeys={checkedKeysState}
        onCheck={onCheck}
        onExpand={onExpand}
        expandedKeys={expandedKeys}
        defaultExpandAll={false}
        autoExpandParent={true}
        checkStrictly={false}
      />
    </Box>
  );
};
Result
When the user clicks on a checkbox, the onCheck callback fires with the new list of checked keys.
You call setCheckedKeysState(newChecked), so the tree sees it has, say, [ '/some/pathA', '/some/pathB' ] checked, and it visually marks them.
Because you now have all the currently checked node keys in newChecked, your loop over them properly accumulates all those files.
onSelect in the parent gets the full list of selected files (not just the most recent).
That’s it! With this controlled approach to checking, you’ll see:

The checkboxes remain in sync with user clicks.
Multiple selections become possible.
The final concatenation includes all the currently checked items.
Summary
rc-tree is a controlled component for checkboxes, so you must store checkedKeys in your own state. Once you do that and use the entire array of checked keys for recursion, the check marks will be visible, and multiple checks will be included in your final file list.