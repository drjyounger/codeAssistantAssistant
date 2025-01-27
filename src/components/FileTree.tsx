// src/components/FileTree.tsx

import React, { useEffect, useState } from 'react';
import Tree from 'rc-tree';
import 'rc-tree/assets/index.css';
import { Box, CircularProgress, Typography } from '@mui/material';
import type { DataNode } from 'rc-tree/lib/interface';
import type { Key } from 'rc-tree/lib/interface';
import { GitHubFile } from '../types';
import { isTextFile } from '../services/FileService';

interface FileTreeProps {
  rootPath: string;
  onSelect: (allFiles: string[], textFiles: string[]) => void;
  changedFiles?: GitHubFile[];
  onError: (error: Error) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  rootPath,
  onSelect,
  changedFiles = [],
  onError
}) => {
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
  const [nodeMap, setNodeMap] = useState<Record<string, { isDirectory: boolean }>>({});
  const [checkedKeysState, setCheckedKeysState] = useState<Key[]>([]);
  const [fileCount, setFileCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    const fetchDirectory = async () => {
      if (!rootPath) return;
      
      setLoading(true);
      try {
        const response = await fetch('/api/local/directory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderPath: rootPath, recursive: true })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch directory structure');
        }

        const data = await response.json();
        if (data.success && data.data) {
          const newNodeMap: Record<string, { isDirectory: boolean }> = {};
          
          const transformNode = (node: any): DataNode => {
            newNodeMap[node.id] = { isDirectory: node.isDirectory };
            
            return {
              key: node.id,
              title: node.name,
              children: node.children?.map(transformNode)
            };
          };

          const rootNode = transformNode({
            id: rootPath,
            name: rootPath.split('/').pop() || rootPath,
            isDirectory: true,
            children: data.data
          });

          setNodeMap(newNodeMap);
          setTreeData([rootNode]);
        }
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchDirectory();
  }, [rootPath, onError]);

  const getAllFilesInDirectory = async (dirPath: string): Promise<string[]> => {
    try {
      // Skip node_modules directories
      if (dirPath.includes('node_modules')) {
        return [];
      }

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
          // Skip if this is a node_modules directory
          if (item.id.includes('node_modules')) {
            continue;
          }
          const subFiles = await getAllFilesInDirectory(item.id);
          files = files.concat(subFiles);
          // Update count as we process each directory
          setFileCount(prev => prev + subFiles.length);
        } else {
          files.push(item.id);
          // Update count for individual files
          setFileCount(prev => prev + 1);
        }
      }
      return files;
    } catch (err) {
      console.error('Error scanning directory:', err);
      return [];
    }
  };

  const onCheck = async (
    checkedKeysParam: Key[] | { checked: Key[]; halfChecked: Key[] }
  ) => {
    let checkedKeys: Key[] = [];
    let halfCheckedKeys: Key[] = [];

    if (Array.isArray(checkedKeysParam)) {
      checkedKeys = checkedKeysParam;
    } else {
      checkedKeys = checkedKeysParam.checked;
      halfCheckedKeys = checkedKeysParam.halfChecked || [];
    }

    const allKeys = [...checkedKeys, ...halfCheckedKeys];
    setCheckedKeysState(allKeys);

    // Reset counter and set processing state
    setFileCount(0);
    setIsProcessing(true);

    let allFiles: string[] = [];
    let textFiles: string[] = [];

    try {
      for (const key of allKeys) {
        const nodePath = key.toString();
        const node = nodeMap[nodePath];

        if (node?.isDirectory) {
          const filesInDir = await getAllFilesInDirectory(nodePath);
          allFiles.push(...filesInDir);
        } else {
          allFiles.push(nodePath);
          setFileCount(prev => prev + 1);
        }
      }

      // Remove duplicates and filter text files
      const uniqueAllFiles = Array.from(new Set(allFiles));
      const uniqueTextFiles = uniqueAllFiles.filter(path => isTextFile(path));

      onSelect(uniqueAllFiles, uniqueTextFiles);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
      <Tree
        checkable
        treeData={treeData}
        onCheck={onCheck}
        checkedKeys={checkedKeysState}
        onExpand={setExpandedKeys}
        expandedKeys={expandedKeys}
        defaultExpandAll={false}
        autoExpandParent={true}
        checkStrictly={false}
      />
      
      {/* Progress Counter */}
      {isProcessing && (
        <Box sx={{ 
          mt: 2, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          bgcolor: '#f5f5f5',
          p: 1,
          borderRadius: 1
        }}>
          <CircularProgress size={20} />
          <Typography>
            Processing Files... Total Found: {fileCount}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FileTree;
