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

const tokenFormSchema = z.object({
  name: z.string().min(1, "Token name is required"),
  symbol: z.string().min(1, "Token symbol is required"),
  decimals: z.number().min(0).max(18),
  initialSupply: z.string().min(1, "Initial supply is required"),
  mintable: z.boolean(),
  burnable: z.boolean(),
  pausable: z.boolean(),
  maxWallet: z.boolean(),
  maxTx: z.boolean(),
  maxTxAmount: z.string(),
  blacklist: z.boolean(),
  enableTrading: z.boolean(),
  buyTax: z.number().min(0).max(100),
  sellTax: z.number().min(0).max(100),
  transferTax: z.number().min(0).max(100),
  enableLiquidity: z.boolean(),
  autoBurn: z.boolean(),
  autoBurnAmount: z.number(),
  enableDividends: z.boolean(),
  claimWait: z.number(),
  minimumAmount: z.number(),
  antibot: z.boolean(),
  cooldownTime: z.number(),
})

type TokenFormValues = z.infer<typeof tokenFormSchema>

export function TokenCreationForm() {
  const { sessionId, isInitialized } = useSession()
  const form = useForm<TokenFormValues>({
    resolver: zodResolver(tokenFormSchema),
    defaultValues: {
      name: "",
      symbol: "",
      decimals: 0,
      initialSupply: "",
      mintable: false,
      burnable: false,
      pausable: false,
      maxWallet: false,
      maxTx: false,
      maxTxAmount: "",
      blacklist: false,
      enableTrading: false,
      buyTax: 0,
      sellTax: 0,
      transferTax: 0,
      enableLiquidity: false,
      autoBurn: false,
      autoBurnAmount: 0,
      enableDividends: false,
      claimWait: 0,
      minimumAmount: 0,
      antibot: false,
      cooldownTime: 0,
    },
  })

  useWebSocket(sessionId, isInitialized, (config) => {
    console.log('Form received config update:', config)
    console.log('Current form values:', form.getValues())
    
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
        if (currentValue !== value) {
          console.log(`Updating form field: ${key} with value:`, value);
          form.setValue(key as keyof TokenFormValues, value, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });
        } else {
          console.log(`Field ${key} unchanged, no update needed.`);
        }
      } else {
        console.log(`Field ${key} not found in form`);
      }
    })
    
    console.log('Updated form values:', form.getValues())
  })

  const onSubmit = (values: TokenFormValues) => {
    console.log('Form submitted:', values)
    // Submit işlemi daha sonra eklenecek
  }

  return (
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
                    <Input
                      placeholder="MyToken"
                      {...field}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30
                        focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-300"
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
                    <Input
                      placeholder="MTK"
                      {...field}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30
                        focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-300"
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
                      <Input
                        type="number"
                        value={value.toString()}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30
                          focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-300"
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
                      <Input
                        placeholder="1000000"
                        {...field}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30
                          focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-300"
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
          <AccordionItem value="features" className="border-white/10 px-2 group">
            <AccordionTrigger className="text-white hover:text-primary transition-colors py-4 group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <span>Basic Features</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="grid gap-4 pt-4">
              {["mintable", "burnable", "pausable"].map((feature) => (
                <FormField
                  key={feature}
                  control={form.control}
                  name={feature as keyof TokenFormValues}
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={value as boolean}
                          onCheckedChange={(checked: CheckedState) => {
                            onChange(checked === true)
                          }}
                          className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
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

          <AccordionItem value="limits" className="border-white/10 px-2 group">
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
                      <Checkbox
                        checked={value as boolean}
                        onCheckedChange={(checked: CheckedState) => {
                          onChange(checked === true)
                        }}
                        className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Max Transaction Amount</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="10000"
                          {...field}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30
                            focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-300"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="taxes" className="border-white/10 px-2 group">
            <AccordionTrigger className="text-white hover:text-primary transition-colors py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Percent className="w-5 h-5 text-primary" />
                </div>
                <span>Taxes</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="grid gap-4 pt-4">
              {["buyTax", "sellTax", "transferTax"].map((tax) => (
                <FormField
                  key={tax}
                  control={form.control}
                  name={tax as keyof TokenFormValues}
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel className="text-white">{tax.replace("Tax", " Tax (%)")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={value.toString()}
                          onChange={(e) => onChange(Number(e.target.value))}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30
                            focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-300"
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

          <AccordionItem value="security" className="border-white/10 px-2 group">
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
                name="antibot"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={value as boolean}
                        onCheckedChange={(checked: CheckedState) => {
                          onChange(checked === true)
                        }}
                        className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
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
                      <Input
                        type="number"
                        value={value.toString()}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30
                          focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-300"
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
  )
}

