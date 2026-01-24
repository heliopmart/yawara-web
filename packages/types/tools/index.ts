import {Users} from '../index'

// --------------------------------------------
// --------- TOOLS INTERFACES------------
// --------------------------------------------

  export interface Tool {
    id: string;
    name: string;
    status: 'AVAILABLE' | 'ALLOCATED';
    target: string;
    created_at: string;
    updated_at: string;
    allocated_at: string;
    quantity: number;
    is_tool: boolean;
    last_used_at: string | null;
    last_allocated_id: string | null;
    allocated_id: string | null; // user id
    nucleus_id: string;
    description: string;
    deleted: boolean;
  }

export interface UserAllocated{
  id: Users['id'];
  name: Users['name'];
}

// --------------------------------------------
// --------- TOOLS BACKEND --------------
// --------------------------------------------

// ---------------- REPOSITORY ----------------


// --------------------------------------------
// --------- TOOLS FRONTEND -------------
// --------------------------------------------


export interface ToolShowProps {
  id: Tool['id'];
  name: Tool['name'];
  status: Tool['status'];
  target: Tool['target'];
  quantity: Tool['quantity'];
  is_tool: Tool['is_tool'];
  description: Tool['description'];
  user_allocated: UserAllocated | null;
  last_used_at: Tool['last_used_at'];
  allocated_at: Tool['allocated_at'];

  user_is_owner?: boolean;
}