// src/components/FileTree.tsx

import React, { useEffect, useState } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { ExpandMore, ChevronRight, Folder, InsertDriveFile } from '@mui/icons-material';
import { Box, Checkbox, CircularProgress, Typography } from '@mui/material';

import { FileNode, GitHubFile } from '../types';
import { readLocalDirectory } from '../services/LocalFileService';

interface FileTreeProps {
  rootPath: string;
  onSelect: (files: string[]) => void;
  changedFiles?: GitHubFile[];
  onError: (error: Error) => void;
}

interface TreeNode {
  id: string;
  name: string;
  isDirectory: boolean;
  children?: TreeNode[];
}

/**
 * Renders a TreeView of the local file system starting at rootPath.
 * Allows checkbox selection of files/folders. "changedFiles" are pre-selected.
 */
export const FileTree: React.FC<FileTreeProps> = ({
  rootPath,
  onSelect,
  changedFiles = [],
  onError
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDirectory = async () => {
      if (!rootPath) return;
      
      setLoading(true);
      try {
        const response = await fetch('/api/local/directory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rootPath }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch directory structure');
        }

        const data = await response.json();
        if (data.success && data.data) {
          setTreeData({
            id: rootPath,
            name: rootPath.split('/').pop() || rootPath,
            isDirectory: true,
            children: data.data
          });
        } else {
          throw new Error(data.error || 'Failed to load directory structure');
        }
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchDirectory();
  }, [rootPath, onError]);

  // New helper function to get all child node IDs
  const getAllChildIds = (node: TreeNode): string[] => {
    let ids: string[] = [node.id];
    if (node.children) {
      node.children.forEach(child => {
        ids = [...ids, ...getAllChildIds(child)];
      });
    }
    return ids;
  };

  // New helper function to find a node by ID
  const findNode = (id: string, node: TreeNode): TreeNode | null => {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(id, child);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper to get all child file paths from a directory
  const getAllChildPaths = (node: TreeNode): string[] => {
    let paths: string[] = [];
    if (!node.isDirectory) {
      paths.push(node.id);
    } else if (node.children) {
      node.children.forEach(child => {
        paths = [...paths, ...getAllChildPaths(child)];
      });
    }
    return paths;
  };

  // Updated selection handler
  const handleSelectedChange = (nodeId: string) => {
    setSelectedItems(prev => {
      const node = treeData ? findNode(nodeId, treeData) : null;
      if (!node) return prev;

      const newSelection = new Set(prev);
      const isCurrentlySelected = newSelection.has(nodeId);
      
      // Get all child paths if this is a directory
      const pathsToToggle = node.isDirectory ? getAllChildPaths(node) : [nodeId];
      
      pathsToToggle.forEach(path => {
        if (isCurrentlySelected) {
          newSelection.delete(path);
        } else {
          newSelection.add(path);
        }
      });

      const result = Array.from(newSelection);
      onSelect(result);
      return result;
    });
  };

  const getNodeIcon = (node: TreeNode) => {
    return node.isDirectory ? <Folder color="primary" /> : <InsertDriveFile />;
  };

  const renderTree = (node: TreeNode) => {
    if (!node || !node.id) return null;

    return (
      <TreeItem
        key={node.id}
        itemId={node.id}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
            <Checkbox
              checked={selectedItems.includes(node.id)}
              onChange={() => handleSelectedChange(node.id)}
              onClick={(e) => e.stopPropagation()}
              size="small"
            />
            {getNodeIcon(node)}
            <Typography sx={{ ml: 1 }}>
              {node.name}
            </Typography>
          </Box>
        }
        sx={{
          '& .MuiTreeItem-content': {
            padding: '4px 0'
          }
        }}
      >
        {Array.isArray(node.children)
          ? node.children.map((child) => renderTree(child))
          : null}
      </TreeItem>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (!treeData) {
    return null;
  }

  return (
    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
      <SimpleTreeView
        multiSelect
        selectedItems={selectedItems}
        onSelectedItemsChange={(_, itemIds) => {
          if (itemIds.length > 0) {
            handleSelectedChange(itemIds[0]);
          }
        }}
        aria-label="file system navigator"
        slots={{
          expandIcon: ChevronRight,
          collapseIcon: ExpandMore
        }}
        sx={{
          height: '400px',
          flexGrow: 1,
          maxWidth: '100%',
          overflowY: 'auto',
          '& .MuiTreeItem-root': {
            '& .MuiTreeItem-content': {
              padding: '2px 0'
            }
          }
        }}
      >
        {renderTree(treeData)}
      </SimpleTreeView>
    </Box>
  );
};

export default FileTree;
