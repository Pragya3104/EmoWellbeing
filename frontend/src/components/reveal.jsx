import { useEffect, useRef, useState } from "react"

export default function Reveal({
  children,
  delay = 0,
  className = "",
}) {
  const ref = useRef()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (ref.current) observer.observe(ref.current)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: isVisible
          ? "translateY(0px) scale(1)"
          : "translateY(30px) scale(0.98)",
        opacity: isVisible ? 1 : 0,
        filter: isVisible ? "blur(0px)" : "blur(8px)",
        transition: `all 0.8s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}