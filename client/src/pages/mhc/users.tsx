import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { User, Subsidiary } from "@shared/schema";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function Users() {
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: subsidiaries = [] } = useQuery<Subsidiary[]>({
    queryKey: ["/api/subsidiaries"],
  });

  // Function to get subsidiary name
  const getSubsidiaryName = (subsidiaryId: number | null) => {
    if (!subsidiaryId) return "MHC";
    const subsidiary = subsidiaries.find(s => s.id === subsidiaryId);
    return subsidiary?.name || "Unknown";
  };

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Manage all users across the platform
        </p>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "mhc_admin" ? "default" : "secondary"}>
                    {user.role === "mhc_admin" 
                      ? "MHC Admin" 
                      : user.role === "subsidiary_admin" 
                        ? "Subsidiary Admin" 
                        : "Staff"}
                  </Badge>
                </TableCell>
                <TableCell>{getSubsidiaryName(user.subsidiaryId)}</TableCell>
                <TableCell>
                  <Badge variant="outline">Active</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
