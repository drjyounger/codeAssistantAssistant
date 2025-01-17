// src/components/FileTree.tsx

import React, { useState, useEffect } from 'react';
import { TreeView, TreeItem } from '@mui/lab';
import { ExpandMore, ChevronRight, Folder, InsertDriveFile } from '@mui/icons-material';
import { Box, Checkbox, CircularProgress } from '@mui/material';

import { FileNode } from '../types';
import { getDirectoryTree } from '../services/FileService';

interface FileTreeProps {
  rootPath: string;
  onSelect: (selectedPaths: string[]) => void;
  changedFiles: Array<{ filename: string; status: string }>;
}

/**
 * Renders a TreeView of the local file system starting at rootPath.
 * Allows checkbox selection of files/folders. "changedFiles" are pre-selected.
 */
const FileTree: React.FC<FileTreeProps> = ({ rootPath, onSelect, changedFiles }) => {
  const [treeData, setTreeData] = useState<FileNode | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTree = async () => {
      setLoading(true);
      try {
        // Get the local directory tree from FileService
        const tree = await getDirectoryTree(rootPath);
        setTreeData(tree);

        // Pre-select changed files from the PR, if any
        const newSelected = new Set<string>();
        changedFiles.forEach((file) => {
          newSelected.add(file.filename);
        });
        setSelectedNodes(newSelected);
        onSelect(Array.from(newSelected));
      } catch (error) {
        console.error('Failed to load directory tree:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTree();
  }, [rootPath, changedFiles, onSelect]);

  const handleNodeSelect = (node: FileNode, checked: boolean) => {
    const newSelected = new Set(selectedNodes);

    const updateNodeSelection = (currentNode: FileNode) => {
      if (checked) {
        newSelected.add(currentNode.path);
      } else {
        newSelected.delete(currentNode.path);
      }
      // Recursively update children
      currentNode.children?.forEach((child) => {
        updateNodeSelection(child);
      });
    };

    updateNodeSelection(node);
    setSelectedNodes(newSelected);
    onSelect(Array.from(newSelected));
  };

  const renderTree = (node: FileNode) => (
    <TreeItem
      key={node.path}
      nodeId={node.path}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Checkbox
            checked={selectedNodes.has(node.path)}
            onChange={(e) => handleNodeSelect(node, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
          {node.type === 'directory' ? (
            <Folder color="primary" sx={{ mr: 1 }} />
          ) : (
            <InsertDriveFile sx={{ mr: 1 }} />
          )}
          {/* Show the last segment of the path as the label */}
          {node.path.split('/').pop()}
        </Box>
      }
    >
      {node.children?.map((child) => renderTree(child))}
    </TreeItem>
  );

  if (loading) {
    return <CircularProgress />;
  }

  if (!treeData) {
    return <Box>No tree data available.</Box>;
  }

  return (
    <TreeView
      defaultCollapseIcon={<ExpandMore />}
      defaultExpandIcon={<ChevronRight />}
      sx={{ height: '100%', overflowY: 'auto' }}
    >
      {renderTree(treeData)}
    </TreeView>
  );
};

export default FileTree;
