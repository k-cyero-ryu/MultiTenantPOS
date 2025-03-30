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
import { useTranslation } from "react-i18next";

export default function Users() {
  const { t } = useTranslation();
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: subsidiaries = [] } = useQuery<Subsidiary[]>({
    queryKey: ["/api/subsidiaries"],
  });

  // Function to get subsidiary name
  const getSubsidiaryName = (subsidiaryId: number | null) => {
    if (!subsidiaryId) return t('common.mainHeadCompany');
    const subsidiary = subsidiaries.find(s => s.id === subsidiaryId);
    return subsidiary?.name || t('common.unknown');
  };

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('users.title')}</h1>
        <p className="text-muted-foreground">
          {t('users.manage')}
        </p>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('users.username')}</TableHead>
              <TableHead>{t('users.role')}</TableHead>
              <TableHead>{t('common.company')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "mhc_admin" ? "default" : "secondary"}>
                    {user.role === "mhc_admin" 
                      ? `${t('common.mainHeadCompany')} ${t('users.administrator')}` 
                      : user.role === "subsidiary_admin" 
                        ? t('users.subsidiaryAdmin')
                        : t('users.user')}
                  </Badge>
                </TableCell>
                <TableCell>{getSubsidiaryName(user.subsidiaryId)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{t('common.active')}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
