"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImageUp } from "lucide-react";
import type { Pet } from "@/types";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/toast";
import { usePet } from "@/components/providers";
import { cn } from "@/lib/utils";
import { PetAvatar } from "./pet-avatar";

export interface PetPhotoUploaderProps {
  pet: Pet;
  className?: string;
}

/** Lado del recorte exportado (px). Suficiente para el retrato `xl` en retina. */
const EXPORT_SIZE = 512;
const MAX_ZOOM = 3;

/**
 * Subir la foto de la mascota (Pet Experience B4) — el avatar ES la zona de
 * subida (§1.1). El estado vacío es OBVIO (directiva de Carlos): área completa
 * clickeable, indicador `+cámara` y microcopy "Agregar foto"; con foto, la misma
 * área ofrece "Cambiar foto". Al elegir archivo → Dialog con recorte circular en
 * vivo (arrastrar para encuadrar + zoom) y "Guardar a {nombre}".
 *
 * La primera vez dispara la revelación (§1.1): la cara entra con fade y el toast
 * cálido; el header se actualiza solo (provider → PetAvatar en cascada).
 * Persistencia: andamio local honesto (ver `setPetPhoto` del provider).
 */
export function PetPhotoUploader({ pet, className }: PetPhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const hasPhoto = Boolean(pet.avatarUrl);

  const openPicker = () => inputRef.current?.click();

  function onFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setSrc(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <button
        type="button"
        onClick={openPicker}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFile(e.dataTransfer.files[0]);
        }}
        aria-label={hasPhoto ? `Cambiar la foto de ${pet.name}` : `Agregar una foto de ${pet.name}`}
        className="group relative rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--border-focus)]"
      >
        <PetAvatar
          pet={pet}
          size="xl"
          className={cn(
            "ring-4 transition-transform duration-[var(--duration-standard)] group-hover:scale-[1.02]",
            hasPhoto ? "ring-terracota-100" : "ring-2 ring-dashed ring-terracota-300",
          )}
        />
        <span
          className={cn(
            "absolute -right-0.5 -bottom-0.5 grid size-9 place-items-center rounded-full border-2 border-surface shadow-sm transition-colors",
            hasPhoto
              ? "bg-surface text-text-secondary group-hover:text-text-brand"
              : "bg-terracota-500 text-white",
          )}
          aria-hidden
        >
          <Camera className="size-4" />
        </span>
      </button>
      <button
        type="button"
        onClick={openPicker}
        className="text-[13px] font-semibold text-text-brand underline-offset-2 hover:underline"
      >
        {hasPhoto ? "Cambiar foto" : "Agregar foto"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <Dialog open={src !== null} onOpenChange={(open) => !open && setSrc(null)}>
        <DialogContent className="max-w-md">
          {src && <CropForm pet={pet} src={src} onClose={() => setSrc(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Recorte circular en vivo: la imagen cubre siempre el viewport (escala `cover`
 * como piso), se encuadra arrastrando y se acerca con el slider. El estado vive
 * en px del viewport renderizado; al guardar se re-proyecta a coordenadas
 * naturales de la imagen y se exporta un JPEG cuadrado de 512px.
 */
function CropForm({ pet, src, onClose }: { pet: Pet; src: string; onClose: () => void }) {
  const { setPetPhoto } = usePet();
  const { toast } = useToast();
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  // Lado del viewport renderizado (px). En estado — el render lo necesita y los
  // refs no se leen durante render (regla del compiler).
  const [viewport, setViewport] = useState(288);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setViewport(el.clientWidth || 288);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /** Escala base: la imagen cubre el viewport en zoom 1 (nunca deja bordes). */
  const coverScale = useCallback(
    (n: { w: number; h: number }) => viewport / Math.min(n.w, n.h),
    [viewport],
  );

  const clampOffset = useCallback(
    (o: { x: number; y: number }, z: number, n: { w: number; h: number }) => {
      const s = coverScale(n) * z;
      const maxX = Math.max(0, (n.w * s - viewport) / 2);
      const maxY = Math.max(0, (n.h * s - viewport) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, o.x)),
        y: Math.min(maxY, Math.max(-maxY, o.y)),
      };
    },
    [coverScale, viewport],
  );

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  function onPointerDown(e: React.PointerEvent) {
    if (!natural) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId || !natural) return;
    setOffset(
      clampOffset(
        { x: drag.baseX + (e.clientX - drag.startX), y: drag.baseY + (e.clientY - drag.startY) },
        zoom,
        natural,
      ),
    );
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function onZoom(z: number) {
    setZoom(z);
    if (natural) setOffset((prev) => clampOffset(prev, z, natural));
  }

  function save() {
    const img = imgRef.current;
    if (!img || !natural) return;

    const s = coverScale(natural) * zoom;
    // Punto de la imagen (coords naturales) que está en el centro del viewport.
    const cx = natural.w / 2 - offset.x / s;
    const cy = natural.h / 2 - offset.y / s;
    const half = viewport / 2 / s;

    const canvas = document.createElement("canvas");
    canvas.width = EXPORT_SIZE;
    canvas.height = EXPORT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, cx - half, cy - half, half * 2, half * 2, 0, 0, EXPORT_SIZE, EXPORT_SIZE);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    const isFirst = !pet.avatarUrl;
    setPetPhoto(pet.id, dataUrl);
    onClose();
    if (isFirst) {
      // La revelación (§1.1): el provider cascadea la cara al header y a toda
      // la app; aquí solo cerramos el loop emocional.
      toast({
        title: `¡Hola, ${pet.name}! 🐾`,
        description: "Ya eres parte de la manada. Su cara te acompaña arriba en todo el sitio.",
        variant: "success",
      });
    } else {
      toast({ title: `Actualizamos la foto de ${pet.name}`, variant: "success" });
    }
  }

  const displayW = natural ? natural.w * coverScale(natural) * zoom : 0;
  const displayH = natural ? natural.h * coverScale(natural) * zoom : 0;

  return (
    <>
      <DialogHeader>
        <DialogTitle>La foto de {pet.name}</DialogTitle>
        <DialogDescription>
          Encuádralo. Así lo vas a reconocer de un vistazo.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center gap-5">
        <div
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative size-64 cursor-grab touch-none overflow-hidden rounded-full bg-muted ring-4 ring-terracota-100 select-none active:cursor-grabbing sm:size-72"
        >
          {natural ? (
            /* eslint-disable-next-line @next/next/no-img-element -- data-URL local, sin optimizador */
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              style={{
                width: displayW,
                height: displayH,
                maxWidth: "none",
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
              className="absolute top-1/2 left-1/2"
            />
          ) : (
            <div className="grid size-full place-items-center text-text-muted">
              <ImageUp className="size-8" aria-hidden />
            </div>
          )}
        </div>

        <div className="w-full max-w-72">
          <Slider
            label="Acercar"
            min={1}
            max={MAX_ZOOM}
            step={0.02}
            value={[zoom]}
            onValueChange={([z]) => onZoom(z)}
            aria-label="Zoom de la foto"
          />
        </div>

        <p className="text-center text-[13px] text-text-muted">
          Por ahora la foto se guarda solo en este dispositivo.
        </p>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="ghost">Cancelar</Button>
        </DialogClose>
        <Button onClick={save} disabled={!natural}>
          Guardar a {pet.name}
        </Button>
      </DialogFooter>
    </>
  );
}
