import React from "react"

const BAR_BG_CLASS = "bg-black/35"
const BAR_BORDER_CLASS = "border-white/20"

type SocialIconButtonProps = {
  label: string
  iconSrc: string
  iconClassName?: string
  iconToneClass?: string
  iconOpacityClass?: string
  iconStyle?: React.CSSProperties
  iconNormalFilter?: string
  tooltipBgClass?: string
  tooltipBorderClass?: string
  tooltipTextClass?: string
  className?: string
}

function SocialIconButton({
  label,
  iconSrc,
  iconClassName = "h-3 w-3",
  iconToneClass = "brightness-0 invert",
  iconOpacityClass = "opacity-90 group-hover:opacity-100",
  iconStyle,
  iconNormalFilter,
  tooltipBgClass = "bg-black/75",
  tooltipBorderClass = "border-white/25",
  tooltipTextClass = "text-white/90",
  className = "",
}: SocialIconButtonProps) {
  const whiteFilter = "brightness(0) saturate(100%) invert(100%)"

  return (
    <button
      type="button"
      aria-label={label}
      className={`group relative transition ${className}`}
    >
      <img
        src={iconSrc}
        alt=""
        aria-hidden="true"
        className={`${iconClassName} object-contain transition-opacity duration-150 ${iconToneClass} ${iconOpacityClass}`}
        style={iconStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = whiteFilter
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = iconNormalFilter ?? ""
        }}
        draggable={false}
      />
      <span
        className={`pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-none border px-2 py-1 text-[10px] uppercase tracking-[0.08em] opacity-0 translate-x-1 transition duration-150 group-hover:translate-x-0 group-hover:opacity-100 ${tooltipBgClass} ${tooltipBorderClass} ${tooltipTextClass}`}
      >
        {label}
      </span>
    </button>
  )
}

export default function SocialBar() {
  const socialItems = [
    {
      label: "WhatsApp",
      iconSrc: "/assets/icon/whatsapp.svg",
      iconClassName: "h-6 w-6",
      iconToneClass: "",
      iconNormalFilter: "brightness(0) saturate(100%) invert(67%) sepia(44%) saturate(1074%) hue-rotate(88deg) brightness(93%) contrast(94%)",
      iconStyle: {
        filter: "brightness(0) saturate(100%) invert(67%) sepia(44%) saturate(1074%) hue-rotate(88deg) brightness(93%) contrast(94%)",
      },
      iconOpacityClass: "opacity-100 group-hover:opacity-100",
      tooltipBgClass: "bg-black/80",
      tooltipBorderClass: "border-green-400/40",
      tooltipTextClass: "text-green-300/95",
    },
    {
      label: "Instagram",
      iconSrc: "/assets/icon/instagram.svg",
      iconToneClass: "brightness-0 invert",
      iconOpacityClass: "opacity-30 group-hover:opacity-100",
      tooltipBgClass: "bg-black/75",
      tooltipBorderClass: "border-white/25",
      tooltipTextClass: "text-white/90",
    },
    {
      label: "Facebook",
      iconSrc: "/assets/icon/facebook.svg",
      iconToneClass: "brightness-0 invert",
      iconOpacityClass: "opacity-30 group-hover:opacity-100",
      tooltipBgClass: "bg-black/75",
      tooltipBorderClass: "border-white/25",
      tooltipTextClass: "text-white/90",
    },
    {
      label: "TikTok",
      iconSrc: "/assets/icon/tiktok.svg",
      iconToneClass: "brightness-0 invert",
      iconOpacityClass: "opacity-30 group-hover:opacity-100",
      tooltipBgClass: "bg-black/75",
      tooltipBorderClass: "border-white/25",
      tooltipTextClass: "text-white/90",
    },
    {
      label: "X",
      iconSrc: "/assets/icon/x.svg",
      iconToneClass: "brightness-0 invert",
      iconOpacityClass: "opacity-30 group-hover:opacity-100",
      tooltipBgClass: "bg-black/75",
      tooltipBorderClass: "border-white/25",
      tooltipTextClass: "text-white/90",
    },
    {
      label: "YouTube",
      iconSrc: "/assets/icon/youtube.svg",
      iconToneClass: "brightness-0 invert",
      iconOpacityClass: "opacity-30 group-hover:opacity-100",
      tooltipBgClass: "bg-black/75",
      tooltipBorderClass: "border-white/25",
      tooltipTextClass: "text-white/90",
    },
    {
      label: "Vimeo",
      iconSrc: "/assets/icon/vimeo.svg",
      iconToneClass: "brightness-0 invert",
      iconOpacityClass: "opacity-30 group-hover:opacity-100",
      tooltipBgClass: "bg-black/75",
      tooltipBorderClass: "border-white/25",
      tooltipTextClass: "text-white/90",
    },
  ]

  return (
    <div className="fixed left-[-5px] top-1/2 z-[80] -translate-y-1/2">
      <div
        className={`flex w-12 flex-col items-center gap-5 rounded-none border px-1.5 py-5 text-white backdrop-blur-2xl ${BAR_BORDER_CLASS} ${BAR_BG_CLASS}`}
      >
        {socialItems.map((item) => (
          <SocialIconButton
            key={item.label}
            label={item.label}
            iconSrc={item.iconSrc}
            iconClassName={item.iconClassName}
            iconToneClass={item.iconToneClass}
            iconOpacityClass={item.iconOpacityClass}
            iconStyle={item.iconStyle}
            iconNormalFilter={item.iconNormalFilter}
            tooltipBgClass={item.tooltipBgClass}
            tooltipBorderClass={item.tooltipBorderClass}
            tooltipTextClass={item.tooltipTextClass}
          />
        ))}
      </div>
    </div>
  )
}
