// src/components/FileTree.tsx

import React, { useEffect, useState } from 'react';
import Tree from 'rc-tree';
import 'rc-tree/assets/index.css';
import { Box, CircularProgress } from '@mui/material';
import type { DataNode } from 'rc-tree/lib/interface';
import type { Key } from 'rc-tree/lib/interface';
import { GitHubFile } from '../types';
import { isTextFile } from '../services/FileService';

interface FileTreeProps {
  rootPath: string;
  onSelect: (paths: string[]) => void;
  changedFiles?: GitHubFile[];
  onError: (error: Error) => void;
}

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

  const onCheck = async (
    checkedKeysParam: Key[] | { checked: Key[]; halfChecked: Key[] }
  ) => {
    const newChecked = Array.isArray(checkedKeysParam) 
      ? checkedKeysParam 
      : checkedKeysParam.checked;

    setCheckedKeysState(newChecked);

    let allFiles: string[] = [];

    for (const key of newChecked) {
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
    </Box>
  );
};

export default FileTree;
