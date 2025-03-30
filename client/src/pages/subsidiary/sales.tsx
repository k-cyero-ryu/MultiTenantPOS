import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertSaleSchema } from "@shared/schema";
import type { Sale, Inventory } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function SalesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const subsidiaryId = user?.subsidiaryId;

  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: [`/api/subsidiaries/${subsidiaryId}/sales`],
  });

  const { data: inventory = [] } = useQuery<Inventory[]>({
    queryKey: [`/api/subsidiaries/${subsidiaryId}/inventory`],
  });

  const form = useForm({
    resolver: zodResolver(insertSaleSchema),
    defaultValues: {
      itemId: 0,
      quantity: 1,
      salePrice: 0,
      subsidiaryId: subsidiaryId,
      userId: user?.id,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ReturnType<typeof form.getValues>) => {
      const res = await apiRequest(
        "POST",
        `/api/subsidiaries/${subsidiaryId}/sales`,
        // Cast to any to resolve type mismatch
        {
          ...data,
          subsidiaryId,
          timestamp: new Date(),
        } as any
      );

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || t('sales.recordFailedDefault'));
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/subsidiaries/${subsidiaryId}/sales`] });
      queryClient.invalidateQueries({ queryKey: [`/api/subsidiaries/${subsidiaryId}/inventory`] });
      toast({ title: t('sales.recordSuccess') });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ 
        title: t('sales.recordFailed'), 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const onItemSelect = (itemId: string) => {
    const item = inventory.find((i) => i.id === parseInt(itemId));
    if (item) {
      form.setValue("salePrice", item.salePrice);
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('sales.title')}</h1>
          <p className="text-muted-foreground">
            {t('sales.manage')}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>{t('sales.recordSale')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('sales.recordNewSale')}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) =>
                  // Cast to any to resolve type mismatch
                  createMutation.mutate(data as any)
                )}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="itemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sales.item')}</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          onItemSelect(value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('sales.selectItem')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {inventory.map((item) => (
                            <SelectItem
                              key={item.id}
                              value={item.id.toString()}
                            >
                              {item.name} (${item.salePrice.toFixed(2)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sales.quantity')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sales.salePrice')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  {t('sales.recordSale')}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('sales.date')}</TableHead>
              <TableHead>{t('sales.item')}</TableHead>
              <TableHead>{t('sales.quantity')}</TableHead>
              <TableHead>{t('sales.price')}</TableHead>
              <TableHead>{t('sales.total')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => {
              const item = inventory.find((i) => i.id === sale.itemId);
              return (
                <TableRow key={sale.id}>
                  <TableCell>
                    {format(new Date(sale.timestamp), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item?.name || t('common.unknown')}
                  </TableCell>
                  <TableCell>{sale.quantity}</TableCell>
                  <TableCell>${sale.salePrice.toFixed(2)}</TableCell>
                  <TableCell>
                    ${(sale.quantity * sale.salePrice).toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}