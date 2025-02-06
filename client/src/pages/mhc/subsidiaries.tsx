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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertSubsidiarySchema, insertUserSchema } from "@shared/schema";
import type { Subsidiary } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";

// Add the getLogoUrl function at the top of the file, after the imports
const getLogoUrl = (logoPath: string) => {
  if (!logoPath) return '';
  // Remove /uploads/ prefix if present since the directory is served at root
  return logoPath.replace('/uploads/', '/');
};

export default function Subsidiaries() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<Subsidiary | null>(null);

  const { data: subsidiaries = [] } = useQuery<Subsidiary[]>({
    queryKey: ["/api/subsidiaries"],
  });

  const form = useForm({
    resolver: zodResolver(insertSubsidiarySchema),
    defaultValues: {
      name: "",
      taxId: "",
      email: "",
      phoneNumber: "",
      address: "",
      city: "",
      country: "",
      status: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ReturnType<typeof form.getValues>) => {
      const formData = new FormData();
      const logoInput = document.querySelector<HTMLInputElement>('#logo-upload');
      const logoFile = logoInput?.files?.[0];

      formData.append('name', data.name);
      formData.append('taxId', data.taxId);
      formData.append('email', data.email);
      formData.append('phoneNumber', data.phoneNumber);
      formData.append('status', data.status.toString());

      if (data.address) formData.append('address', data.address);
      if (data.city) formData.append('city', data.city);
      if (data.country) formData.append('country', data.country);

      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const res = await fetch('/api/subsidiaries', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to create subsidiary');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subsidiaries"] });
      toast({ title: "Subsidiary created successfully" });
      setOpen(false);
      form.reset();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: boolean;
    }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/subsidiaries/${id}`,
        { status }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subsidiaries"] });
      toast({ title: "Subsidiary status updated" });
    },
  });

  // Add user creation form
  const userForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "subsidiary_admin" as const,
      subsidiaryId: undefined,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: ReturnType<typeof userForm.getValues>) => {
      const res = await apiRequest("POST", "/api/register", data);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "User created successfully" });
      setSelectedSubsidiary(null);
      userForm.reset();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create user", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Subsidiaries</h1>
          <p className="text-muted-foreground">
            Manage your subsidiary companies
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Subsidiary</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Subsidiary</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) =>
                  createMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax ID</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="col-span-2">
                    <Label htmlFor="logo-upload">Company Logo</Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/png,image/jpeg"
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload a PNG or JPG image for the company logo
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormLabel>Active</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  Create Subsidiary
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
                <TableHead className="w-[60px]">Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Tax ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subsidiaries.map((subsidiary) => (
                <TableRow key={subsidiary.id}>
                  <TableCell>
                    {subsidiary.logo && (
                      <img
                        src={getLogoUrl(subsidiary.logo)}
                        alt={`${subsidiary.name} logo`}
                        className="w-8 h-8 rounded object-contain bg-muted p-1"
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {subsidiary.name}
                  </TableCell>
                  <TableCell>{subsidiary.taxId}</TableCell>
                  <TableCell>{subsidiary.email}</TableCell>
                  <TableCell>{subsidiary.phoneNumber}</TableCell>
                  <TableCell>
                    {[subsidiary.city, subsidiary.country]
                      .filter(Boolean)
                      .join(", ")}
                  </TableCell>
                  <TableCell>
                    {subsidiary.status ? "Active" : "Inactive"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={subsidiary.status}
                        onCheckedChange={(checked) =>
                          updateStatusMutation.mutate({
                            id: subsidiary.id,
                            status: checked,
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedSubsidiary(subsidiary)}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!selectedSubsidiary}
        onOpenChange={() => setSelectedSubsidiary(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin User for {selectedSubsidiary?.name}</DialogTitle>
          </DialogHeader>
          <Form {...userForm}>
            <form
              onSubmit={userForm.handleSubmit((data) => {
                if (selectedSubsidiary) {
                  createUserMutation.mutate({
                    ...data,
                    subsidiaryId: selectedSubsidiary.id,
                  });
                }
              })}
              className="space-y-4"
            >
              <FormField
                control={userForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={createUserMutation.isPending}
              >
                Create Admin User
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}