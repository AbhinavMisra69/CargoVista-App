"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, Plus, Trash2, Ship, Package, Box, Target, MapPin, ListOrdered, Siren } from "lucide-react";
import { toast } from "sonner";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export type OrderItem = {
  orderDescription: string;
  enterSource: string;
  enterDestination: string;
  orderWeightKg: number;
  orderVolumeM3: number;
};

export type MultiFormSchema = {
  orders: OrderItem[];
  isPriority: boolean;
  priorityQueue: number[]; 
  selectFieldGoal: string;
};

interface MultiFormProps {
  onFormSubmit?: (data: MultiFormSchema) => void;
  cityOptions?: string[]; 
}

export const MultiForm = ({ onFormSubmit, cityOptions = [] }: MultiFormProps) => {
  // We conditionally render Step 3 based on priority
  const baseSteps = [
    { title: "Cargo Manifest", description: "Details of your shipment", icon: Box },
    { title: "Priority Queue", description: "Set delivery sequence", icon: ListOrdered },
    { title: "Optimization", description: "Set logistics goals", icon: Target },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  
  const form = useForm<MultiFormSchema>({
    shouldUnregister: false, 
    defaultValues: {
      orders: [{ orderDescription: "", enterSource: "", enterDestination: "", orderWeightKg: 50, orderVolumeM3: 5 }],
      isPriority: false,
      priorityQueue: [], 
      selectFieldGoal: "cost_efficient", // Default so validation doesn't fail if skipped
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "orders" });
  
  const isPriority = form.watch("isPriority");
  const priorityQueue = form.watch("priorityQueue");
  const currentOrders = form.watch("orders");

  // DYNAMIC STEPS: If Priority is ON, we only have 2 steps (0 and 1)
  const effectiveSteps = isPriority ? baseSteps.slice(0, 2) : baseSteps;
  const isLastStep = currentStep === effectiveSteps.length - 1;
  const progress = ((currentStep + 1) / effectiveSteps.length) * 100;

  const handleNextButton = async () => {
    const values = form.getValues();
    if (currentStep === 0) {
      // Validate Step 1
      for (const [index, order] of values.orders.entries()) {
        if (!order.orderDescription) { toast.error(`Row ${index + 1}: Description is required`); return; }
        if (!order.enterSource) { toast.error(`Row ${index + 1}: Origin is required`); return; }
        if (!order.enterDestination) { toast.error(`Row ${index + 1}: Destination is required`); return; }
        if (order.enterSource === order.enterDestination) { toast.error(`Row ${index + 1}: Source/Dest cannot be same`); return; }
      }
    }
    
    // Proceed
    if (!isLastStep) {
        setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBackButton = () => { if (currentStep > 0) setCurrentStep((prev) => prev - 1); };

  const handleFinalSubmit = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    const values = form.getValues();
    
    if (!values.orders || values.orders.length === 0) { toast.error("Manifest is empty"); return; }
    
    // If Priority is OFF, force them to pick a goal (Step 3)
    if (!isPriority && !values.selectFieldGoal) { 
        toast.error("Please select a goal."); 
        return; 
    }
    
    if (onFormSubmit) await onFormSubmit(values);
  };

  const togglePriorityForOrder = (orderIndex: number) => {
    const currentQueue = form.getValues("priorityQueue") || [];
    const queueIndex = currentQueue.indexOf(orderIndex);
    let newQueue = [...currentQueue];
    if (queueIndex === -1) newQueue.push(orderIndex); 
    else newQueue.splice(queueIndex, 1); 
    form.setValue("priorityQueue", newQueue, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };

  const CurrentIcon = effectiveSteps[currentStep].icon;

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
                <div style={{ position: 'absolute', top: -12, left: -12, background: '#2563eb', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{index + 1}</div>
                {fields.length > 1 && (<div style={{ position: 'absolute', top: 10, right: 10, cursor: 'pointer' }} onClick={() => remove(index)}><Trash2 className="w-5 h-5 text-slate-500 hover:text-red-500" /></div>)}
                <div className="space-y-8 mt-4">
                  <Controller name={`orders.${index}.orderDescription`} control={form.control} render={({ field }) => (<div><label style={theme.label}>Description</label><Input {...field} placeholder="e.g. 20ft Container" style={theme.input} /></div>)} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <Controller name={`orders.${index}.enterSource`} control={form.control} render={({ field }) => (<div><label style={theme.label}><MapPin className="w-3 h-3 text-green-500 inline mr-1"/>Origin</label><Select value={field.value} onValueChange={field.onChange}><SelectTrigger style={theme.input}><SelectValue placeholder="Origin..." /></SelectTrigger><SelectContent style={{ backgroundColor: '#0f172a', color: 'white' }}>{cityOptions.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent></Select></div>)} />
                    <Controller name={`orders.${index}.enterDestination`} control={form.control} render={({ field }) => (<div><label style={theme.label}><MapPin className="w-3 h-3 text-red-500 inline mr-1"/>Dest</label><Select value={field.value} onValueChange={field.onChange}><SelectTrigger style={theme.input}><SelectValue placeholder="Destination..." /></SelectTrigger><SelectContent style={{ backgroundColor: '#0f172a', color: 'white' }}>{cityOptions.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent></Select></div>)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                    <Controller name={`orders.${index}.orderWeightKg`} control={form.control} render={({ field }) => (<div><div className="flex justify-between mb-2"><label style={theme.label}>Weight</label><span className="text-xs text-blue-400">{field.value} kg</span></div><Slider value={[field.value]} onValueChange={(val) => field.onChange(val[0])} min={10} max={1000} /></div>)} />
                    <Controller name={`orders.${index}.orderVolumeM3`} control={form.control} render={({ field }) => (<div><div className="flex justify-between mb-2"><label style={theme.label}>Volume</label><span className="text-xs text-emerald-400">{field.value} m³</span></div><Slider value={[field.value]} onValueChange={(val) => field.onChange(val[0])} min={0} max={10} step={0.5} /></div>)} />
                  </div>
                </div>
              </div>
            ))}
            {fields.length < 5 && (<Button type="button" variant="ghost" onClick={() => append({ orderDescription: "", enterSource: "", enterDestination: "", orderWeightKg: 50, orderVolumeM3: 5 })} style={theme.buttonSecondary}><Plus className="w-5 h-5 mr-2" /> Add Shipment</Button>)}
          </div>
        );
      case 1:
         return (
             <div className="space-y-6">
                <Controller
                  name="isPriority"
                  control={form.control}
                  render={({ field }) => (
                    <div style={{ ...theme.bgCard, padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400"><Ship className="w-8 h-8"/></div>
                            <div>
                                <h3 className="text-white text-lg font-medium">Enable Priority Routing</h3>
                                <p style={theme.textMuted}>
                                    {field.value ? "Standard Optimization (Step 3) will be skipped." : "Sequence orders for expedited delivery."}
                                </p>
                            </div>
                        </div>
                        <Switch 
                            checked={!!field.value} 
                            onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (!checked) form.setValue("priorityQueue", []);
                            }} 
                            className="scale-150 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-600" 
                        />
                    </div>
                  )}
                />
                
                {isPriority && (
                    <div className="space-y-4 pt-4 animate-in slide-in-from-top-4">
                        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl flex items-center gap-3">
                            <Siren className="text-red-500 w-5 h-5" />
                            <p className="text-red-200 text-sm">Priority Mode Active. Standard cost/time models will be ignored.</p>
                        </div>
                        <div className="text-xs font-bold text-blue-400 uppercase tracking-widest pl-1">Tap to Rank Orders</div>
                        {(currentOrders || []).map((order, index) => {
                            const currentQ = priorityQueue || [];
                            const queuePos = currentQ.indexOf(index);
                            const isSelected = queuePos !== -1;
                            const rank = queuePos + 1;

                            return (
                                <div 
                                    key={index} 
                                    onClick={(e) => { e.preventDefault(); togglePriorityForOrder(index); }} 
                                    style={{ 
                                      ...theme.bgCard, 
                                      padding: '20px', 
                                      cursor: 'pointer', 
                                      borderColor: isSelected ? '#3b82f6' : '#334155', 
                                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.05)' : '#0f172a',
                                      transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                                      transition: 'all 0.2s ease'
                                    }} 
                                    className="flex justify-between items-center group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-600 text-slate-500'}`}>
                                          {isSelected ? rank : index + 1}
                                        </div>
                                        <div>
                                          <div className={`font-medium ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                            {order.orderDescription || "Untitled Shipment"}
                                          </div>
                                          {isSelected && <div className="text-xs text-blue-400 font-mono mt-1">PRIORITY QUEUE: POS {rank}</div>}
                                        </div>
                                    </div>
                                    {isSelected && <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]">RANK {rank}</span>}
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
                 <Controller name="selectFieldGoal" control={form.control} render={({ field }) => (
                        <div className="space-y-8">
                            <div className="text-center"><Target className="w-12 h-12 text-blue-400 mx-auto mb-4" /><h3 className="text-2xl font-bold text-white mb-2">Primary Logistics Goal</h3></div>
                            <Select value={field.value} onValueChange={field.onChange}><SelectTrigger style={{ ...theme.input, height: '80px', fontSize: '18px', paddingLeft: '32px' }}><SelectValue placeholder="Select Strategy..." /></SelectTrigger><SelectContent style={{ backgroundColor: '#0f172a', color: 'white' }}><SelectItem value="cost_efficient">💰 Cost Efficiency</SelectItem><SelectItem value="speed">⚡ time/speed efficiency</SelectItem><SelectItem value="eco_friendly">Personalized</SelectItem></SelectContent></Select>
                        </div>
                    )} />
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
             <div className="flex items-center gap-4"><div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20"><CurrentIcon className="w-6 h-6 text-blue-500"/></div><div><CardTitle className="text-2xl font-bold text-white">{effectiveSteps[currentStep].title}</CardTitle><CardDescription style={theme.textMuted}>{effectiveSteps[currentStep].description}</CardDescription></div></div>
             <span className="text-slate-500 font-bold text-sm bg-slate-950 px-4 py-2 rounded-full border border-slate-800">STEP {currentStep+1} / {effectiveSteps.length}</span>
          </div>
          <div style={{ height: '6px', backgroundColor: '#1e293b', marginTop: '24px', borderRadius: '4px', overflow: 'hidden' }}><div style={{ height: '100%', width: `${progress}%`, backgroundColor: '#3b82f6', transition: 'width 0.5s ease' }} /></div>
        </CardHeader>
        <div>
          <CardContent style={{ padding: '40px', backgroundColor: '#020817', minHeight: '600px' }}>{renderCurrentStepContent()}</CardContent>
          <CardFooter style={{ padding: '32px 40px', borderTop: '1px solid #1e293b', backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
             <div className="flex w-full justify-between">
                <Button type="button" variant="ghost" onClick={handleBackButton} disabled={currentStep===0} style={{ color: '#94a3b8', visibility: currentStep===0?'hidden':'visible' }}><ChevronLeft className="mr-2 h-5 w-5"/> Back</Button>
                
                {/* IF LAST STEP (OR PRIORITY ACTIVE) -> SHOW SUBMIT */}
                {!isLastStep ? (
                    <Button type="button" onClick={handleNextButton} className="bg-blue-600 hover:bg-blue-500 text-white px-8 h-12 text-base rounded-xl font-semibold shadow-lg">Next Step <ChevronRight className="ml-2 h-5 w-5"/></Button>
                ) : (
                    <Button type="button" disabled={form.formState.isSubmitting} onClick={handleFinalSubmit} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 h-12 text-base rounded-xl font-semibold shadow-lg">
                        {form.formState.isSubmitting && <Loader2 className="mr-2 animate-spin"/>} 
                        {isPriority ? "Submit Priority Manifest" : "Submit Manifest"}
                    </Button>
                )}
             </div>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
};