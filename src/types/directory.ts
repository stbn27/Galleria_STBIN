export interface DirectoryNode {
  path: string;
  name: string;
  count: number;
  children: DirectoryNode[];
}