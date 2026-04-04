import GradientText from "@/components/GradientText"

export default function GradientHeading({
  children,
  className = "",
}) {
  return (
    <GradientText
      colors={["#5227FF","#ff1988","#8d40f1"]} 
      animationSpeed={12}
      showBorder={false}
      className={className}
    >
      {children}
    </GradientText>
  )
}