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

export default function SalesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

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
        {
          ...data,
          subsidiaryId,
          timestamp: new Date().toISOString() // Ensure proper date format
        }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/subsidiaries/${subsidiaryId}/sales`] });
      queryClient.invalidateQueries({ queryKey: [`/api/subsidiaries/${subsidiaryId}/inventory`] });
      toast({ title: "Sale recorded successfully" });
      setOpen(false);
      form.reset();
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
          <h1 className="text-3xl font-bold mb-2">Sales</h1>
          <p className="text-muted-foreground">
            Record and view sales transactions
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Record Sale</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Sale</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) =>
                  createMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="itemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          onItemSelect(value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an item" />
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
                      <FormLabel>Quantity</FormLabel>
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
                      <FormLabel>Sale Price</FormLabel>
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
                  Record Sale
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
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Total</TableHead>
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
                    {item?.name || "Unknown"}
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