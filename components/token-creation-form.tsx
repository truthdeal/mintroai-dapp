"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"

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

export function TokenCreationForm() {
  const form = useForm<z.infer<typeof tokenFormSchema>>({
    resolver: zodResolver(tokenFormSchema),
    defaultValues: {
      decimals: 18,
      mintable: true,
      burnable: true,
      pausable: true,
      maxWallet: false,
      maxTx: true,
      blacklist: true,
      enableTrading: true,
      buyTax: 1,
      sellTax: 2,
      transferTax: 0,
      enableLiquidity: true,
      autoBurn: true,
      autoBurnAmount: 100,
      enableDividends: true,
      claimWait: 3600,
      minimumAmount: 50,
      antibot: true,
      cooldownTime: 1200,
    },
  })

  function onSubmit(values: z.infer<typeof tokenFormSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Token Details</h2>
            <div className="h-1 w-1/3 bg-gradient-to-r from-primary/50 to-transparent rounded-full" />
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Decimals</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
          <AccordionItem value="features" className="border-white/10 px-2">
            <AccordionTrigger className="text-white hover:text-primary transition-colors py-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Basic Features
              </div>
            </AccordionTrigger>
            <AccordionContent className="grid gap-4 pt-4">
              {["mintable", "burnable", "pausable"].map((feature) => (
                <FormField
                  key={feature}
                  control={form.control}
                  name={feature as any}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
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

          <AccordionItem value="limits" className="border-white/10 px-2">
            <AccordionTrigger className="text-white hover:text-primary transition-colors py-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Limits & Trading
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="maxTx"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
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

          <AccordionItem value="taxes" className="border-white/10 px-2">
            <AccordionTrigger className="text-white hover:text-primary transition-colors py-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Taxes
              </div>
            </AccordionTrigger>
            <AccordionContent className="grid gap-4 pt-4">
              {["buyTax", "sellTax", "transferTax"].map((tax) => (
                <FormField
                  key={tax}
                  control={form.control}
                  name={tax as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">{tax.replace("Tax", " Tax (%)")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30
                            focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-300"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="security" className="border-white/10 px-2">
            <AccordionTrigger className="text-white hover:text-primary transition-colors py-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Security
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="antibot"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </FormControl>
                    <FormLabel className="text-white font-normal">Anti-bot Protection</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cooldownTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Cooldown Time (seconds)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30
                          focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-300"
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
              transition-all duration-300 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]"
          >
            Create Token
          </Button>
        </div>
      </form>
    </Form>
  )
}

