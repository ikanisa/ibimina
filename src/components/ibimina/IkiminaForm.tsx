import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(3, "Code must be at least 3 characters"),
  type: z.enum(["ROSCA", "ASCA", "HYBRID"]),
  status: z.enum(["ACTIVE", "PAUSED", "CLOSED"]).default("ACTIVE"),
  contributionAmount: z.coerce.number().min(0, "Amount must be positive"),
  frequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]).default("MONTHLY"),
  referenceGranularity: z.enum(["GROUP_ONLY", "GROUP_MEMBER"]).default("GROUP_MEMBER"),
  autoAssignMissingMember: z.boolean().default(false),
});

export type IkiminaFormValues = z.infer<typeof formSchema>;

interface IkiminaFormProps {
  saccoId: string;
  ikiminaId?: string;
  initialData?: Partial<IkiminaFormValues>;
  onCompleted?: () => void;
}

export const IkiminaForm = ({ saccoId, ikiminaId, initialData, onCompleted }: IkiminaFormProps) => {
  const form = useForm<IkiminaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      code: initialData?.code ?? "",
      type: initialData?.type as IkiminaFormValues["type"] ?? "ROSCA",
      status: initialData?.status as IkiminaFormValues["status"] ?? "ACTIVE",
      contributionAmount: initialData?.contributionAmount ?? 0,
      frequency: initialData?.frequency as IkiminaFormValues["frequency"] ?? "MONTHLY",
      referenceGranularity: initialData?.referenceGranularity as IkiminaFormValues["referenceGranularity"] ?? "GROUP_MEMBER",
      autoAssignMissingMember: initialData?.autoAssignMissingMember ?? false,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name ?? "",
        code: initialData.code ?? "",
        type: initialData.type as IkiminaFormValues["type"] ?? "ROSCA",
        status: initialData.status as IkiminaFormValues["status"] ?? "ACTIVE",
        contributionAmount: initialData.contributionAmount ?? 0,
        frequency: initialData.frequency as IkiminaFormValues["frequency"] ?? "MONTHLY",
        referenceGranularity: initialData.referenceGranularity as IkiminaFormValues["referenceGranularity"] ?? "GROUP_MEMBER",
        autoAssignMissingMember: initialData.autoAssignMissingMember ?? false,
      });
    }
  }, [initialData, form]);

  const handleSubmit = async (values: IkiminaFormValues) => {
    const payload = {
      name: values.name,
      code: values.code.toUpperCase(),
      sacco_id: saccoId,
      type: values.type,
      status: values.status,
      settings_json: {
        contribution: {
          amountType: "FIXED",
          fixedAmount: values.contributionAmount,
          frequency: values.frequency,
          schedule: { cutoffTime: "17:00", graceDays: 2 },
        },
        depositMapping: {
          granularity: values.referenceGranularity,
          autoAssignMissingMember: values.autoAssignMissingMember,
          referenceMask: "DISTRICT.SACCO.GROUP(.MEMBER)?",
        },
      },
    };

    if (!ikiminaId) {
      const { error } = await supabase.from("ibimina").insert(payload);
      if (error) {
        console.error(error);
        toast.error("Failed to create ikimina");
        return;
      }
      toast.success("Ikimina created");
    } else {
      const { error } = await supabase
        .from("ibimina")
        .update(payload)
        .eq("id", ikiminaId);
      if (error) {
        console.error(error);
        toast.error("Failed to update ikimina");
        return;
      }
      toast.success("Ikimina updated");
    }

    onCompleted?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ikimina name</FormLabel>
              <FormControl>
                <Input placeholder="Twizigame" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group code</FormLabel>
              <FormControl>
                <Input placeholder="TWIZ" {...field} onChange={(event) => field.onChange(event.target.value.toUpperCase())} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ROSCA">ROSCA</SelectItem>
                    <SelectItem value="ASCA">ASCA</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="contributionAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contribution amount (RWF)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step={100} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contribution frequency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="referenceGranularity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference granularity</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select granularity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="GROUP_ONLY">Group only</SelectItem>
                    <SelectItem value="GROUP_MEMBER">Group + Member</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="autoAssignMissingMember"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <FormLabel>Auto assign untagged deposits</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    When enabled, deposits without member code stay with the group bucket.
                  </p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full">{ikiminaId ? "Update Ikimina" : "Create Ikimina"}</Button>
      </form>
    </Form>
  );
};
