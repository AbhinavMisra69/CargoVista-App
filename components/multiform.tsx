"use client";

import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, Trash2, Trophy, Ship, Package, Box, Target } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

// --- SCHEMA ---
const orderItemSchema = z.object({
  orderDescription: z.string().min(1, "Required"),
  enterDestination: z.string().min(1, "Required"),
  orderWeightKg: z.number().min(10).max(1000),
  orderVolumeM3: z.number().min(0).max(10),
  orderDeadlineOptional: z.date().optional(),
});

const formSchema = z.object({
  orders: z.array(orderItemSchema).min(1).max(5),
  isPriority: z.boolean(),
  priorityQueue: z.array(z.number()), 
  selectFieldGoal: z.string().min(1, "Please select a logistics goal"),
});

export type MultiFormSchema = z.infer<typeof formSchema>;

// UPDATED INTERFACE: Accepts list of cities
interface MultiFormProps {
  onFormSubmit?: (data: MultiFormSchema) => void;
  cityOptions?: string[]; 
}

export const MultiForm = ({ onFormSubmit, cityOptions = [] }: MultiFormProps) => {
  const steps = [
    { title: "Cargo Manifest", description: "Details of your shipment", icon: Box },
    { title: "Priority Queue", description: "Expedite specific orders", icon: Ship },
    { title: "Optimization", description: "Set logistics goals", icon: Target },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [isFormValid, setIsFormValid] = useState(false);
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const form = useForm<MultiFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orders: [{ orderDescription: "", enterDestination: "", orderWeightKg: 50, orderVolumeM3: 5, orderDeadlineOptional: undefined }],
      isPriority: false,
      priorityQueue: [],
      selectFieldGoal: "",
    },
    mode: "onChange",
  });

  // Debug: Log form state changes
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change') {
        console.log(`Form field changed: ${name}`, value);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Validate form when reaching the last step
  useEffect(() => {
    if (isLastStep) {
      const validateForm = async () => {
        const isValid = await form.trigger();
        setIsFormValid(isValid);
        console.log("Form validation on last step:", isValid, form.formState.errors);
      };
      validateForm();
    }
  }, [isLastStep, form]);

  // Watch for form changes on last step to update validation state
  useEffect(() => {
    if (isLastStep) {
      const subscription = form.watch(async () => {
        const isValid = await form.trigger();
        setIsFormValid(isValid);
      });
      return () => subscription.unsubscribe();
    }
  }, [isLastStep, form]);

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "orders" });
  const isPriority = form.watch("isPriority");
  const priorityQueue = form.watch("priorityQueue");
  const currentOrders = form.watch("orders");

  const handleNextButton = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 0) {
      fieldsToValidate = currentOrders.flatMap((_, index) => [
        `orders.${index}.orderDescription`,
        `orders.${index}.enterDestination`,
        `orders.${index}.orderWeightKg`,
        `orders.${index}.orderVolumeM3`,
      ]);
    } else if (currentStep === 1) {
      fieldsToValidate = ["isPriority"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["selectFieldGoal"];
    }
    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid && !isLastStep) {
      setCurrentStep((prev) => prev + 1);
      // If moving to last step, validate the entire form
      if (currentStep === steps.length - 2) {
        const fullValidation = await form.trigger();
        setIsFormValid(fullValidation);
      }
    }
  };

  const handleBackButton = () => { if (currentStep > 0) setCurrentStep((prev) => prev - 1); };

  const onSubmit = async (values: MultiFormSchema) => {
    console.log("=== MULTIFORM SUBMIT TRIGGERED ===");
    console.log("Form values:", JSON.stringify(values, null, 2));
    console.log("onFormSubmit callback exists:", !!onFormSubmit);
    
    // Validate that we have at least one order with a destination
    const hasValidOrders = values.orders.some(
      (order) => order.enterDestination && order.enterDestination.trim() !== ""
    );
    
    if (!hasValidOrders) {
      console.error("Validation failed: No valid orders");
      toast.error("Please add at least one order with a valid destination");
      return;
    }

    if (!values.selectFieldGoal) {
      console.error("Validation failed: No goal selected");
      toast.error("Please select a logistics goal");
      return;
    }

    // Always call onFormSubmit if it exists, regardless of form validation state
    if (!onFormSubmit) {
      console.error("onFormSubmit callback is NOT provided!");
      toast.error("Form submission handler not configured. Please refresh the page.");
      return;
    }

    try {
      console.log("Calling onFormSubmit callback with values:", values);
      await onFormSubmit(values);
      console.log("onFormSubmit completed successfully");
    } catch (err) {
      console.error("Error in onSubmit:", err);
      console.error("Error stack:", err instanceof Error ? err.stack : "No stack trace");
      toast.error(`Failed to submit manifest: ${err instanceof Error ? err.message : 'Unknown error'}`);
      // Don't re-throw - we want to show the error but not break the form
    }
  };

  const togglePriorityForOrder = (orderIndex: number) => {
    const currentQueue = [...priorityQueue];
    const queueIndex = currentQueue.indexOf(orderIndex);
    if (queueIndex === -1) currentQueue.push(orderIndex);
    else currentQueue.splice(queueIndex, 1);
    form.setValue("priorityQueue", currentQueue, { shouldValidate: true });
  };

  const CurrentIcon = steps[currentStep].icon;

  // --- FORCE THEME STYLES (Navy) ---
  const theme = {
    bgMain: { backgroundColor: '#020817', color: 'white', borderColor: '#1e293b' },
    bgCard: { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px' },
    input: { backgroundColor: '#1e293b', border: '1px solid #475569', color: 'white', height: '56px', borderRadius: '8px' },
    label: { color: '#94a3b8', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' } as React.CSSProperties,
    textMuted: { color: '#94a3b8' },
    buttonSecondary: { backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px dashed #475569', color: '#94a3b8' },
  };

  const renderCurrentStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {fields.map((fieldItem, index) => (
              <div key={fieldItem.id} style={{ ...theme.bgCard, padding: '32px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -12, left: -12, background: '#2563eb', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {index + 1}
                </div>
                {fields.length > 1 && (
                  <div style={{ position: 'absolute', top: 10, right: 10, cursor: 'pointer' }} onClick={() => remove(index)}>
                    <Trash2 className="w-5 h-5 text-slate-500 hover:text-red-500" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-8 ml-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  <span style={{ color: '#cbd5e1', fontWeight: 600, letterSpacing: '0.05em' }}>SHIPMENT UNIT</span>
                </div>
                <div className="space-y-8">
                  <Controller
                    name={`orders.${index}.orderDescription`}
                    control={form.control}
                    render={({ field, fieldState }: any) => (
                      <div>
                        <label style={theme.label}>Description</label>
                        <Input {...field} placeholder="e.g. 20ft Container - Electronics" style={theme.input} />
                        {fieldState.invalid && <span className="text-red-500 text-xs mt-1 block">{fieldState.error?.message}</span>}
                      </div>
                    )}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    
                    {/* --- UPDATED DESTINATION SELECT --- */}
                    <Controller
                      name={`orders.${index}.enterDestination`}
                      control={form.control}
                      render={({ field, fieldState }: any) => (
                        <div>
                          <label style={theme.label}>Destination</label>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger style={theme.input}><SelectValue placeholder="Select City..." /></SelectTrigger>
                            <SelectContent style={{ backgroundColor: '#0f172a', color: 'white', borderColor: '#334155', maxHeight: '300px' }}>
                              {cityOptions.length > 0 ? (
                                cityOptions.map((city) => (
                                  <SelectItem key={city} value={city} className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800 focus:text-white">
                                    {city}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>No cities available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    />

                    <Controller
                      name={`orders.${index}.orderDeadlineOptional`}
                      control={form.control}
                      render={({ field }: any) => (
                        <div>
                          <label style={theme.label}>Deadline</label>
                          <div className="[&>button]:w-full [&>button]:justify-start [&>button]:text-left [&>button]:font-normal" style={{ color: 'white' }}>
                             <div className="[&>button]:!bg-[#1e293b] [&>button]:!border-[#475569] [&>button]:!text-slate-300 [&>button]:!h-[56px] [&>button]:!rounded-lg">
                               <DatePicker value={field.value} onChange={field.onChange} />
                             </div>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', paddingTop: '16px' }}>
                    <Controller
                      name={`orders.${index}.orderWeightKg`}
                      control={form.control}
                      render={({ field }: any) => (
                        <div>
                          <div className="flex justify-between mb-4">
                             <label style={theme.label}>Weight</label>
                             <div className="px-3 py-1 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold">{field.value} kg</div>
                          </div>
                          <div className="h-8 flex items-center px-1">
                            <Slider value={[field.value]} onValueChange={(val) => field.onChange(val[0])} min={10} max={1000} step={1} />
                          </div>
                        </div>
                      )}
                    />
                     <Controller
                      name={`orders.${index}.orderVolumeM3`}
                      control={form.control}
                      render={({ field }: any) => (
                        <div>
                          <div className="flex justify-between mb-4">
                             <label style={theme.label}>Volume</label>
                             <div className="px-3 py-1 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">{field.value} m³</div>
                          </div>
                          <div className="h-8 flex items-center px-1">
                            <Slider value={[field.value]} onValueChange={(val) => field.onChange(val[0])} min={0} max={10} step={0.5} />
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
            {fields.length < 5 && (
              <Button type="button" variant="ghost" onClick={() => append({ orderDescription: "", enterDestination: "", orderWeightKg: 50, orderVolumeM3: 5, orderDeadlineOptional: undefined })} style={{ ...theme.buttonSecondary, height: '64px', width: '100%' }}>
                <Plus className="w-5 h-5 mr-2" /> Add Another Shipment
              </Button>
            )}
          </div>
        );
      case 1:
         return (
             <div className="space-y-6">
                <Controller
                  name="isPriority"
                  control={form.control}
                  render={({ field }: any) => (
                    <div style={{ ...theme.bgCard, padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400"><Ship className="w-8 h-8"/></div>
                            <div>
                                <h3 className="text-white text-lg font-medium">Priority Handling</h3>
                                <p style={theme.textMuted}>Enable expedited shipping for specific containers.</p>
                            </div>
                        </div>
                        <Switch checked={field.value} onCheckedChange={(val) => { field.onChange(val); if(!val) { setTimeout(() => form.setValue("priorityQueue", []), 0); }}} className="scale-150 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-600" />
                    </div>
                  )}
                />
                {isPriority && (
                    <div className="space-y-4 pt-4">
                        <div className="text-xs font-bold text-blue-400 uppercase tracking-widest pl-1">Select Sequence</div>
                        {(currentOrders || []).map((order, index) => {
                            const isSelected = priorityQueue.indexOf(index) !== -1;
                            return (
                                <div key={index} onClick={() => togglePriorityForOrder(index)} style={{ ...theme.bgCard, padding: '20px', cursor: 'pointer', borderColor: isSelected ? '#3b82f6' : '#334155', backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : '#0f172a' }} className="flex justify-between items-center transition-all">
                                    <div className="flex items-center gap-4">
                                        <Checkbox checked={isSelected} className="border-slate-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 text-white w-6 h-6" />
                                        <span className="text-slate-300 font-medium">Order #{index + 1}: {order.orderDescription || "Untitled"}</span>
                                    </div>
                                    {isSelected && <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">Rank {priorityQueue.indexOf(index) + 1}</span>}
                                </div>
                            )
                        })}
                    </div>
                )}
             </div>
         );
      case 2:
        return (
            <div style={{ padding: '40px 0' }}>
                 <Controller
                    name="selectFieldGoal"
                    control={form.control}
                    rules={{ required: "Please select a logistics goal" }}
                    render={({ field, fieldState }: any) => (
                        <div className="space-y-8">
                            <div className="text-center">
                                <Target className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-white mb-2">Primary Logistics Goal</h3>
                            </div>
                            <Select 
                              value={field.value || ""} 
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Trigger validation when value changes
                                setTimeout(() => {
                                  form.trigger("selectFieldGoal");
                                  if (isLastStep) {
                                    form.trigger().then((isValid) => setIsFormValid(isValid));
                                  }
                                }, 0);
                              }}
                            >
                                <SelectTrigger style={{ ...theme.input, height: '80px', fontSize: '18px', paddingLeft: '32px' }}><SelectValue placeholder="Select Strategy..." /></SelectTrigger>
                                <SelectContent style={{ backgroundColor: '#0f172a', color: 'white', borderColor: '#334155' }}>
                                    <SelectItem value="cost_efficient" className="py-4 text-lg">💰 Cost Efficiency</SelectItem>
                                    <SelectItem value="speed" className="py-4 text-lg">⚡ Speed / Expedited</SelectItem>
                                    <SelectItem value="eco_friendly" className="py-4 text-lg">🌱 Eco-Friendly</SelectItem>
                                </SelectContent>
                            </Select>
                            {fieldState.invalid && (
                              <p className="text-red-500 text-sm mt-2 text-center">{fieldState.error?.message}</p>
                            )}
                        </div>
                    )}
                />
            </div>
        );
      default: return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card style={{ ...theme.bgMain, borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <CardHeader style={{ padding: '40px', borderBottom: '1px solid #1e293b', background: 'linear-gradient(to bottom, #0f172a, #020817)' }}>
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-4">
                 <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20"><CurrentIcon className="w-6 h-6 text-blue-500"/></div>
                 <div>
                     <CardTitle className="text-2xl font-bold text-white">{steps[currentStep].title}</CardTitle>
                     <CardDescription style={theme.textMuted}>{steps[currentStep].description}</CardDescription>
                 </div>
             </div>
             <span className="text-slate-500 font-bold text-sm bg-slate-900 px-4 py-2 rounded-full border border-slate-800">STEP {currentStep+1} / {steps.length}</span>
          </div>
          <div style={{ height: '6px', backgroundColor: '#1e293b', marginTop: '24px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, backgroundColor: '#3b82f6', transition: 'width 0.5s ease' }} />
          </div>
        </CardHeader>
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            console.log("=== FORM onSubmit EVENT ===");
            const formValues = form.getValues();
            console.log("Form values from getValues():", formValues);
            await onSubmit(formValues);
          }}
        >
          <CardContent style={{ padding: '40px', backgroundColor: '#020817', minHeight: '600px' }}>
            {renderCurrentStepContent()}
          </CardContent>
          <CardFooter style={{ padding: '32px 40px', borderTop: '1px solid #1e293b', backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
             <div className="flex w-full justify-between">
                <Button type="button" variant="ghost" onClick={handleBackButton} disabled={currentStep===0} style={{ color: '#94a3b8', visibility: currentStep===0?'hidden':'visible' }}>
                    <ChevronLeft className="mr-2 h-5 w-5"/> Back
                </Button>
                {!isLastStep ? (
                    <Button type="button" onClick={handleNextButton} className="bg-blue-600 hover:bg-blue-500 text-white px-8 h-12 text-base rounded-xl font-semibold shadow-lg shadow-blue-900/20">
                        Next Step <ChevronRight className="ml-2 h-5 w-5"/>
                    </Button>
                ) : (
                    <Button 
                      type="submit" 
                      disabled={form.formState.isSubmitting}
                      onClick={() => {
                        console.log("=== SUBMIT BUTTON CLICKED ===");
                        const formValues = form.getValues();
                        console.log("Form state:", {
                          isSubmitting: form.formState.isSubmitting,
                          isValid: form.formState.isValid,
                          errors: form.formState.errors,
                          values: formValues,
                        });
                        console.log("onFormSubmit callback exists:", !!onFormSubmit);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 h-12 text-base rounded-xl font-semibold shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {form.formState.isSubmitting && <Spinner className="mr-2"/>} Submit Manifest
                    </Button>
                )}
             </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};