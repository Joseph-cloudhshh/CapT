import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function GlassCard({ children, className, glow, animate = true, ...props }) {
  const Comp = animate ? motion.div : 'div';
  const animateProps = animate ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: "easeOut" }
  } : {};

  return (
    <Comp
      className={cn(
        "glass rounded-xl p-5",
        glow === 'gold' && "gold-glow gold-border",
        glow === 'steel' && "steel-glow",
        className
      )}
      {...animateProps}
      {...props}
    >
      {children}
    </Comp>
  );
}