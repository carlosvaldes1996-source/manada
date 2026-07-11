"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { RadioGroup, Radio } from "@/components/ui/radio";
import { useToast } from "@/components/ui/toast";
import { usePet, type PetProfileChanges } from "@/components/providers";
import { BreedCombobox } from "./breed-combobox";

export interface PetEditDialogProps {
  pet: Pet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Límite del validador del backend (`StoreUpdatePet`): peso ≤ 120 kg. */
const MAX_WEIGHT_KG = 120;

/**
 * Edición del perfil de mascota (Pet Experience B5) — el ÚNICO lugar de edición.
 * Reemplaza los toasts muertos ("se conecta en la siguiente fase") por guardado
 * real: los cambios van a `updatePet` del provider (optimista en memoria; con
 * sesión, PATCH `/store/pets/:id` — el mismo contrato validado de D34).
 *
 * El formulario vive en un componente interno que se monta al abrir (Radix
 * desmonta el contenido al cerrar) → el borrador se siembra fresco desde la
 * mascota en cada apertura, sin efectos de sincronización.
 */
export function PetEditDialog({ pet, open, onOpenChange }: PetEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <PetEditForm key={pet.id} pet={pet} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Semántica setter-only: solo se envía lo que cambió; un campo dejado vacío no
 * borra el dato (excepto salud: limpiar el texto limpia la lista). Editar el
 * peso a mano lo marca `weightSource: "exacto"` (afina ración y anticipación,
 * cierra el hedge "estimado" de F3).
 */
function PetEditForm({ pet, onClose }: { pet: Pet; onClose: () => void }) {
  const { updatePet } = usePet();
  const { toast } = useToast();

  const [weight, setWeight] = useState(() => (pet.weightKg != null ? String(pet.weightKg) : ""));
  const [weightError, setWeightError] = useState<string | null>(null);
  const [breed, setBreed] = useState(() => pet.breed ?? "");
  const [neutered, setNeutered] = useState<"" | "si" | "no">(() =>
    typeof pet.neutered === "boolean" ? (pet.neutered ? "si" : "no") : "",
  );
  const [conditionsText, setConditionsText] = useState(() => (pet.conditions ?? []).join(", "));

  function save() {
    const changes: PetProfileChanges = {};

    // Peso: editarlo a mano = fuente "exacto". Vacío = sin cambio (setter-only).
    const raw = weight.trim().replace(",", ".");
    if (raw !== "") {
      const kg = Math.round(parseFloat(raw) * 10) / 10;
      if (!Number.isFinite(kg) || kg <= 0 || kg > MAX_WEIGHT_KG) {
        setWeightError(`Entre 0,1 y ${MAX_WEIGHT_KG} kg.`);
        return;
      }
      if (kg !== pet.weightKg || pet.weightSource !== "exacto") {
        changes.weightKg = kg;
        changes.weightSource = "exacto";
      }
    }

    const nextBreed = breed.trim();
    if (nextBreed && nextBreed !== (pet.breed ?? "")) changes.breed = nextBreed;

    if (neutered !== "" && (neutered === "si") !== pet.neutered) {
      changes.neutered = neutered === "si";
    }

    const conditions = conditionsText
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    if (conditions.join("|") !== (pet.conditions ?? []).join("|")) {
      changes.conditions = conditions;
    }

    if (Object.keys(changes).length > 0) {
      updatePet(pet.id, changes);
      toast({
        title: `Guardamos los cambios de ${pet.name}`,
        description: "Cada dato nos deja anticiparnos mejor a lo que necesita.",
        variant: "success",
      });
    }
    onClose();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar el perfil de {pet.name}</DialogTitle>
        <DialogDescription>
          Lo que completes se guarda en su perfil y afina su ración, su anticipación y sus
          recomendaciones.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <Input
          label="Peso"
          type="number"
          inputMode="decimal"
          min={0}
          step={0.1}
          trailing="kg"
          placeholder="8"
          value={weight}
          onChange={(e) => {
            setWeight(e.target.value);
            setWeightError(null);
          }}
          error={weightError}
          hint={
            pet.weightSource && pet.weightSource !== "exacto"
              ? "Hoy usamos un peso estimado; confírmalo y afinamos su plan."
              : undefined
          }
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text-primary">Raza</span>
          <BreedCombobox species={pet.species} value={breed} onChange={setBreed} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-text-primary">
            ¿Está esterilizado{pet.species === "gato" ? "/a" : ""}?
          </span>
          <RadioGroup
            value={neutered}
            onValueChange={(v) => setNeutered(v as "si" | "no")}
            className="flex gap-5"
            aria-label="Esterilización"
          >
            <Radio value="si" label="Sí" />
            <Radio value="no" label="No" />
          </RadioGroup>
        </div>

        <Input
          label="Info de salud"
          placeholder="renal, sobrepeso…"
          value={conditionsText}
          onChange={(e) => setConditionsText(e.target.value)}
          hint="Separa con comas. Nos ayuda a filtrar lo que no le hace bien."
        />
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="ghost">Cancelar</Button>
        </DialogClose>
        <Button onClick={save}>Guardar cambios</Button>
      </DialogFooter>
    </>
  );
}
