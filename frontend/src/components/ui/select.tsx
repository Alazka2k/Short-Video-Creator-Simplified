import React, { useEffect, useState } from "react"
import { AnimatePresence, motion, MotionConfig } from "framer-motion"
import { ChevronDownIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

type TSelectData = {
  id: string
  label: string
  value: string
  description?: string
  icon?: string
  disabled?: boolean
  custom?: React.ReactNode
}

type SelectProps = {
  data?: TSelectData[]
  onChange?: (value: string | null) => void
  defaultValue?: string
  value?: string
  title?: string
  allowDeselect?: boolean
  className?: string
}

const Select = ({ 
  data, 
  defaultValue, 
  value, 
  onChange, 
  title = "Choose Option",
  allowDeselect = false,
  className
}: SelectProps) => {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<TSelectData | undefined>(undefined)

  useEffect(() => {
    if (value !== undefined) {
      const item = data?.find((i) => i.value === value)
      setSelected(item)
    } else if (defaultValue) {
      const item = data?.find((i) => i.value === defaultValue)
      setSelected(item)
    } else {
      setSelected(data?.[0])
    }
  }, [value, defaultValue, data])

  const onSelect = (value: string) => {
    const item = data?.find((i) => i.value === value)
    if (allowDeselect && item?.value === selected?.value) {
      setSelected(undefined)
      onChange?.(null)
    } else {
      setSelected(item as TSelectData)
      onChange?.(value)
    }
    setOpen(false)
  }

  return (
    <MotionConfig
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        ease: "0.65, 0, 0.35, 1",
      }}
    >
      <motion.div className="w-full">
        <AnimatePresence mode="popLayout">
          {!open ? (
            <motion.div
              whileTap={{ scale: 0.95 }}
              animate={{
                borderRadius: 16,
              }}
              layout
              layoutId="dropdown"
              onClick={() => setOpen(true)}
              className={cn(
                "overflow-hidden rounded-lg border border-input hover:border-primary/30 bg-background shadow-sm w-full cursor-pointer",
                selected && "border-primary/40 bg-primary/5",
                className
              )}
            >
              <SelectItem item={selected} noDescription={false} />
            </motion.div>
          ) : (
            <motion.div
              layout
              animate={{
                borderRadius: 16,
              }}
              layoutId="dropdown"
              className={cn(
                "overflow-hidden rounded-lg w-full border border-input hover:border-primary/30 bg-background shadow-md",
                className
              )}
              ref={ref}
            >
              <Head title={title} setOpen={setOpen} />
              <div className="w-full overflow-y-auto max-h-[300px] divide-y divide-primary/10">
                {data?.map((item) => (
                  <SelectItem
                    order={item?.value}
                    noDescription={false}
                    key={item.id}
                    item={item}
                    onChange={onSelect}
                    isSelected={item.value === selected?.value}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  )
}

export default Select

const Head = ({ title, setOpen }: { title: string, setOpen: (open: boolean) => void }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10">
      <h3 className="text-sm font-medium">{title}</h3>
      <button
        onClick={() => setOpen(false)}
        className="rounded-full p-1 hover:bg-primary/5"
      >
        <X size={16} className="text-muted-foreground" />
      </button>
    </div>
  )
}

type SelectItemProps = {
  item?: TSelectData
  noDescription?: boolean
  order?: string
  onChange?: (index: string) => void
  isSelected?: boolean
}

const animation = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: (custom: number) => ({
      delay: custom * 0.1,
      duration: 0.5,
    }),
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: (custom: number) => ({
      delay: custom * 0.1,
    }),
  },
}

const SelectItem = ({
  item,
  noDescription = true,
  order,
  onChange,
  isSelected
}: SelectItemProps) => {
  const iconClasses = cn(
    "flex items-center justify-center rounded-full border",
    isSelected ? "border-primary/40 bg-primary/5" : "border-primary/20 bg-primary/5",
    item?.custom ? "h-12 w-12" : "h-10 w-10"
  );

  return (
    <motion.div
      className={cn(
        "group flex cursor-pointer items-center justify-between gap-2 p-0 hover:bg-primary/5 w-full",
        isSelected && "bg-primary/5",
        noDescription && "!p-0"
      )}
      variants={animation}
      initial="hidden"
      animate="visible"
      exit="exit"
      key={"product-" + item?.id + "-order-" + order}
      custom={order}
      onClick={() => onChange?.(order as string)}
    >
      <div className="flex items-center gap-3 min-h-[48px] w-full px-4 py-3">
        <motion.div
          layout
          layoutId={`icon-${item?.id}`}
          className={iconClasses}
        >
          {item?.custom || (item?.icon && item.icon.startsWith('/') ? (
            <Image 
              src={item.icon} 
              alt={item.label || ''} 
              width={24} 
              height={24} 
              className="object-contain"
            />
          ) : item?.icon)}
        </motion.div>
        <motion.div layout className="flex flex-col space-y-1 flex-1">
          <motion.strong
            layoutId={`label-${item?.id}`}
            className="text-sm font-semibold text-foreground"
          >
            {item?.label}
          </motion.strong>
          {noDescription ? null : (
            <span className="text-xs text-muted-foreground whitespace-normal pr-4">
              {item?.description}
            </span>
          )}
        </motion.div>
        {noDescription ? (
          <motion.div
            layout
            className="flex items-center justify-center"
          >
            <ChevronDownIcon className="text-primary" size={20} />
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  )
} 