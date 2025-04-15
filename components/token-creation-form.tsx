"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"
import { type CheckedState } from "@radix-ui/react-checkbox"
import { Coins, Shield, Gauge, Percent, Sparkles } from "lucide-react"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useSession } from "@/hooks/useSession"
import { useAccount } from 'wagmi'
import { TokenConfirmationDialog } from "@/components/token-confirmation-dialog"
import { useTokenDeploy } from '@/hooks/useTokenDeploy'
import { TokenSuccessDialog } from "@/components/token-success-dialog"

const tokenFormSchema = z.object({
  name: z.string().min(1, "Token name is required"),
  symbol: z.string().min(1, "Token symbol is required"),
  decimals: z.number().min(0).max(18),
  initialSupply: z.string().min(1, "Initial supply is required"),
  mintable: z.boolean(),
  burnable: z.boolean(),
  pausable: z.boolean(),
  blacklist: z.boolean(),
  maxTx: z.boolean(),
  maxTxAmount: z.number().min(0),
  transferTax: z.number().min(0).max(30),
  antiBot: z.boolean(),
  cooldownTime: z.number(),
})

export type TokenFormValues = z.infer<typeof tokenFormSchema>

export function TokenCreationForm() {
  const { sessionId, isInitialized } = useSession()
  const { address } = useAccount()
  const form = useForm<TokenFormValues>({
    resolver: zodResolver(tokenFormSchema),
    defaultValues: {
      name: "",
      symbol: "",
      decimals: 18,
      initialSupply: "",
      mintable: false,
      burnable: false,
      pausable: false,
      maxTx: false,
      maxTxAmount: 0,
      blacklist: false,
      transferTax: 0,
      antiBot: false,
      cooldownTime: 0,
    },
  })

  const [updatedFields, setUpdatedFields] = React.useState<Set<string>>(new Set())
  const [updatedSections, setUpdatedSections] = React.useState<Set<string>>(new Set())
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false)
  const [isCompiling, setIsCompiling] = React.useState(false)
  const [isDeploying, setIsDeploying] = React.useState(false)
  const [deploymentStatus, setDeploymentStatus] = React.useState<'idle' | 'creating' | 'compiling' | 'deploying' | 'success' | 'error'>('idle')
  const [showSuccess, setShowSuccess] = React.useState(false)
  const [deployedAddress, setDeployedAddress] = React.useState<string | null>(null)

  const { deploy, isPending, isWaiting, isSuccess, error, hash, receipt } = useTokenDeploy()

  // Section'ları field'larla eşleştir
  const fieldToSection: { [key: string]: string } = {
    mintable: 'features',
    burnable: 'features',
    pausable: 'features',
    blacklist: 'features',
    maxTx: 'limits',
    maxTxAmount: 'limits',
    transferTax: 'taxes',
    antiBot: 'security',
    cooldownTime: 'security',
  }

  useWebSocket(sessionId, isInitialized, (config) => {
    console.log('Form received config update:', config)
    console.log('Current form values:', form.getValues())
    
    const newUpdatedFields = new Set<string>()
    const newUpdatedSections = new Set<string>()
    let hasChanges = false
    
    // Form değerlerini güncelle
    Object.keys(config).forEach((key) => {
      if (key in form.getValues()) {
        let value = config[key];
        const currentValue = form.getValues()[key as keyof TokenFormValues];
        const formValueType = typeof currentValue;

        // Tip dönüşümü yap
        if (formValueType === 'number' && typeof value === 'string') {
          value = parseFloat(value);
        } else if (formValueType === 'string' && typeof value === 'number') {
          value = value.toString();
        } else if (formValueType === 'boolean' && typeof value !== 'boolean') {
          value = Boolean(value);
        }

        // Yeni değeri mevcut değerle karşılaştır
        const hasChanged = JSON.stringify(currentValue) !== JSON.stringify(value);
        if (hasChanged) {
          console.log(`Updating form field: ${key} with value:`, value);
          form.setValue(key as keyof TokenFormValues, value, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });
          newUpdatedFields.add(key)
          hasChanges = true
          
          // Field'ın bağlı olduğu section'ı da güncelle
          if (fieldToSection[key]) {
            newUpdatedSections.add(fieldToSection[key])
          }
        } else {
          console.log(`Field ${key} unchanged, no update needed.`);
        }
      } else {
        console.log(`Field ${key} not found in form`);
      }
    })
    
    // Sadece değişiklik varsa state'leri güncelle
    if (hasChanges) {
      setUpdatedFields(new Set(newUpdatedFields))
      setUpdatedSections(new Set(newUpdatedSections))
      
      // 4 saniye sonra highlight'ları temizle
      setTimeout(() => {
        setUpdatedFields(new Set())
        setUpdatedSections(new Set())
      }, 4000)
    }
    
    console.log('Updated form values:', form.getValues())
  })

  // useEffect to track deployment status
  React.useEffect(() => {
    if (isPending || isWaiting) {
      setDeploymentStatus('deploying')
    } else if (isSuccess && receipt) {
      setDeploymentStatus('success')
      const deployedAddr = receipt.logs[0].address
      setDeployedAddress(deployedAddr)
      console.log('Transaction hash:', hash)
      console.log('Deployed contract address:', deployedAddr)
      
      // Confirmation dialog'u kapat ve success dialog'u aç
      setTimeout(() => {
        setShowConfirmation(false)
        setDeploymentStatus('idle')
        setShowSuccess(true)
      }, 1000)
    } else if (error) {
      setDeploymentStatus('error')
    }
  }, [isPending, isWaiting, isSuccess, error, hash, receipt])

  const onSubmit = async () => {
    if (!address) {
      console.error('Please connect your wallet first');
      return;
    }
    
    // Instead of sending the request immediately, show the confirmation dialog
    setShowConfirmation(true);
  }
  
  const handleConfirm = async () => {
    try {
      // Contract Creation
      setDeploymentStatus('creating')
      const contractData = {
        chatId: sessionId,
        contractName: form.getValues().name,
        tokenName: form.getValues().name,
        tokenSymbol: form.getValues().symbol,
        decimals: form.getValues().decimals,
        initialSupply: form.getValues().initialSupply,
        ownerAddress: address,
        mintable: form.getValues().mintable,
        burnable: form.getValues().burnable,
        pausable: form.getValues().pausable,
        blacklist: form.getValues().blacklist,
        maxTx: form.getValues().maxTx,
        maxTxAmount: form.getValues().maxTxAmount,
        transferTax: form.getValues().transferTax,
        antiBot: form.getValues().antiBot,
        cooldownTime: form.getValues().cooldownTime,
      };

      // 1. Contract Creation
      const createResponse = await fetch('/api/create-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create contract');
      }

      const createData = await createResponse.json();
      console.log('Contract created:', createData);

      // 2. Contract Compilation
      setDeploymentStatus('compiling')
      const compileResponse = await fetch('/api/compile-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId: sessionId }),
      });

      if (!compileResponse.ok) {
        throw new Error('Failed to compile contract');
      }

      const compileData = await compileResponse.json();
      console.log('Contract compiled:', compileData);

      // 3. Deploy contract
      const deployResponse = await deploy(compileData.bytecode);
      console.log('Contract deployed:', deployResponse);
      // Not: deploy işlemi başarılı/başarısız durumu useEffect içinde takip ediliyor

    } catch (error) {
      console.error('Error:', error);
      setDeploymentStatus('error')
    }
  }

  // Input wrapper component'i
  const AnimatedFormInput = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement> & { isUpdated?: boolean }
  >(({ className, isUpdated, ...props }, ref) => (
    <Input
      ref={ref}
      className={`${className} ${isUpdated ? 'highlight-update' : ''}`}
      {...props}
    />
  ))
  AnimatedFormInput.displayName = 'AnimatedFormInput'

  // Checkbox wrapper component'i
  const AnimatedFormCheckbox = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<typeof Checkbox> & { isUpdated?: boolean }
  >(({ className, isUpdated, ...props }, ref) => (
    <Checkbox
      ref={ref}
      className={`${className} ${isUpdated ? 'highlight-update' : ''}`}
      {...props}
    />
  ))
  AnimatedFormCheckbox.displayName = 'AnimatedFormCheckbox'

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-8">
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-white">Token Details</h2>
              </div>
            </div>

            <motion.div
              className="grid gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Token Name</FormLabel>
                    <FormControl>
                      <AnimatedFormInput
                        placeholder="MyToken"
                        {...field}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30
                          focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-300"
                        isUpdated={updatedFields.has("name")}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Token Symbol</FormLabel>
                    <FormControl>
                      <AnimatedFormInput
                        placeholder="MTK"
                        {...field}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30
                          focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-300"
                        isUpdated={updatedFields.has("symbol")}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="decimals"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel className="text-white">Decimals</FormLabel>
                      <FormControl>
                        <AnimatedFormInput
                          type="number"
                          value={value.toString()}
                          onChange={(e) => onChange(Number(e.target.value))}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30
                            focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-300"
                          isUpdated={updatedFields.has("decimals")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="initialSupply"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Initial Supply</FormLabel>
                      <FormControl>
                        <AnimatedFormInput
                          placeholder="1000000"
                          {...field}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30
                            focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-300"
                          isUpdated={updatedFields.has("initialSupply")}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>
            </motion.div>
          </div>

          <Separator className="bg-white/10" />

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="features" className={`border-white/10 px-2 group ${updatedSections.has('features') ? 'highlight-section rounded-lg' : ''}`}>
              <AccordionTrigger className="text-white hover:text-primary transition-colors py-4 group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <span>Basic Features</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="grid gap-4 pt-4">
                {["mintable", "burnable", "pausable", "blacklist"].map((feature) => (
                  <FormField
                    key={feature}
                    control={form.control}
                    name={feature as keyof TokenFormValues}
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <AnimatedFormCheckbox
                            checked={value as boolean}
                            onCheckedChange={(checked: CheckedState) => {
                              onChange(checked === true)
                            }}
                            className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            isUpdated={updatedFields.has(feature)}
                            {...field}
                          />
                        </FormControl>
                        <FormLabel className="text-white font-normal">
                          {feature.charAt(0).toUpperCase() + feature.slice(1)}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="limits" className={`border-white/10 px-2 group ${updatedSections.has('limits') ? 'highlight-section rounded-lg' : ''}`}>
              <AccordionTrigger className="text-white hover:text-primary transition-colors py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Gauge className="w-5 h-5 text-primary" />
                  </div>
                  <span>Limits & Trading</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="maxTx"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <AnimatedFormCheckbox
                          checked={value as boolean}
                          onCheckedChange={(checked: CheckedState) => {
                            onChange(checked === true)
                          }}
                          className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          isUpdated={updatedFields.has("maxTx")}
                          {...field}
                        />
                      </FormControl>
                      <FormLabel className="text-white font-normal">Max Transaction Limit</FormLabel>
                    </FormItem>
                  )}
                />
                {form.watch("maxTx") && (
                  <FormField
                    control={form.control}
                    name="maxTxAmount" 
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel className="text-white">Max Transaction Amount</FormLabel>
                        <FormControl>
                          <AnimatedFormInput
                            type="number"
                            placeholder="10000"
                            value={value.toString()}
                            onChange={(e) => onChange(Number(e.target.value))}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30
                              focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-300"
                            isUpdated={updatedFields.has("maxTxAmount")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="taxes" className={`border-white/10 px-2 group ${updatedSections.has('taxes') ? 'highlight-section rounded-lg' : ''}`}>
              <AccordionTrigger className="text-white hover:text-primary transition-colors py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Percent className="w-5 h-5 text-primary" />
                  </div>
                  <span>Taxes</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="grid gap-4 pt-4">
                {[/* "buyTax", "sellTax", */ "transferTax"].map((tax) => (
                  <FormField
                    key={tax}
                    control={form.control}
                    name={tax as keyof TokenFormValues}
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel className="text-white">{tax.replace("Tax", " Tax (%)")}</FormLabel>
                        <FormControl>
                          <AnimatedFormInput
                            type="number"
                            value={value.toString()}
                            onChange={(e) => onChange(Number(e.target.value))}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30
                              focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-300"
                            isUpdated={updatedFields.has(tax)}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="security" className={`border-white/10 px-2 group ${updatedSections.has('security') ? 'highlight-section rounded-lg' : ''}`}>
              <AccordionTrigger className="text-white hover:text-primary transition-colors py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <span>Security</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="antiBot"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <AnimatedFormCheckbox
                          checked={value as boolean}
                          onCheckedChange={(checked: CheckedState) => {
                            onChange(checked === true)
                          }}
                          className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          isUpdated={updatedFields.has("antiBot")}
                          {...field}
                        />
                      </FormControl>
                      <FormLabel className="text-white font-normal">Anti-bot Protection</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cooldownTime"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel className="text-white">Cooldown Time (seconds)</FormLabel>
                      <FormControl>
                        <AnimatedFormInput
                          type="number"
                          value={value.toString()}
                          onChange={(e) => onChange(Number(e.target.value))}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30
                            focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-300"
                          isUpdated={updatedFields.has("cooldownTime")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="pt-6">
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold
                transition-all duration-300 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]
                relative overflow-hidden group"
            >
              <span className="relative z-10">Create Token</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 
                translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </Button>
          </div>
        </form>
      </Form>
      
      <TokenConfirmationDialog
        isOpen={showConfirmation}
        onConfirm={handleConfirm}
        onCancel={() => deploymentStatus === 'idle' && setShowConfirmation(false)}
        formData={form.getValues()}
        deploymentStatus={deploymentStatus}
      />

      {deployedAddress && (
        <TokenSuccessDialog
          isOpen={showSuccess}
          onClose={() => setShowSuccess(false)}
          tokenAddress={deployedAddress}
          tokenName={form.getValues().name}
          tokenSymbol={form.getValues().symbol}
        />
      )}
    </>
  )
}
