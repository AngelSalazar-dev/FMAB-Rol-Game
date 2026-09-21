'use client';

import { useState } from 'react';

interface CharacterCreateProps {
  onComplete: (character: any) => void;
}

const ORIGINS = [
  { id: 'central', name: 'Central', desc: 'Equilibrado. Corazón del imperio.', bonus: { str: 1, agi: 1, int: 1, per: 1, vol: 1, car: 1 } },
  { id: 'ishval', name: 'Ishval', desc: 'Alquimia +2, Sospecha inicial +20.', bonus: { int: 2, per: 1 }, penalty: { car: -1 } },
  { id: 'drachma', name: 'Drachma', desc: 'Combate +2, Reputación militar -20.', bonus: { str: 2, vol: 1 }, penalty: { int: -1 } },
  { id: 'xing', name: 'Xing', desc: 'Alquimia diferente, Aliados únicos.', bonus: { agi: 2, per: 1 }, penalty: { str: -1 } },
];

const HISTORIES = [
  { id: 'alchemist', name: 'Alquimista Estatal', desc: 'Reloj de plata. Acceso a recursos. Sospecha +10.', skills: ['alquimia_estatal', 'acceso_archivos'] },
  { id: 'soldier', name: 'Soldado Raso', desc: 'Entrenamiento militar. Equipo estándar. Lealtad cuestionada.', skills: ['combate_militar', 'disciplina', 'primeros_auxilios'] },
  { id: 'civilian', name: 'Civil con Don', desc: 'Alquimia intuitiva. Sin entrenamiento formal. Libertad total.', skills: ['alquimia_intuitiva', 'supervivencia_urbana'] },
  { id: 'prisoner', name: 'Prisionero/Fugitivo', desc: 'Cicatrices. Conocimiento prohibido. Enemigos por todas partes.', skills: ['sigilo', 'contactos_criminales', 'resistencia'] },
];

const ATTRIBUTES = ['str', 'agi', 'int', 'per', 'vol', 'car'] as const;
const ATTRIBUTE_LABELS: Record<string, string> = {
  str: 'Fuerza (FUE)', agi: 'Agilidad (AGI)', int: 'Inteligencia (INT)',
  per: 'Percepción (PER)', vol: 'Voluntad (VOL)', car: 'Carisma (CAR)',
};

function renderAttributeRows(formData: any, handleAttributeChange: any) {
  return ATTRIBUTES.map(attr => (
    <div key={attr} className="bg-fmab-darker border border-fmab-border rounded-lg p-4">
      <div className="flex justify-between mb-2">
        <span className="text-fmab-parchment font-mono">{ATTRIBUTE_LABELS[attr]}</span>
        <span className="text-fmab-goldLight text-xl font-bold">{formData.attributes[attr]}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handleAttributeChange(attr, -1)}
          disabled={formData.attributes[attr] <= 6}
          className="flex-1 py-2 bg-fmab-red border border-fmab-border rounded text-fmab-parchment hover:bg-fmab-redLight disabled:opacity-30"
        >
          −
        </button>
        <button
          onClick={() => handleAttributeChange(attr, 1)}
          disabled={formData.attributes[attr] >= 18 || formData.pointsRemaining <= 0}
          className="flex-1 py-2 bg-fmab-gold border border-fmab-border rounded text-fmab-darker hover:bg-fmab-goldLight disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  ));
}

export function CharacterCreate({ onComplete }: CharacterCreateProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    origin: 'central',
    history: 'civilian',
    seenGate: false,
    appearance: { face: '', scars: [], clothing: '', automail: '' },
    attributes: { str: 10, agi: 10, int: 10, per: 10, vol: 10, car: 10 },
    pointsRemaining: 12,
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAttributeChange = (attr: keyof typeof formData.attributes, delta: number) => {
    setFormData(prev => {
      const current = prev.attributes[attr];
      const newValue = Math.max(6, Math.min(18, current + delta));
      const pointCost = newValue - 10;
      const otherPoints = Object.entries(prev.attributes)
        .filter(([k]) => k !== attr)
        .reduce((sum, [, v]) => sum + Math.max(0, v - 10), 0);
      const totalPoints = pointCost + otherPoints;

      if (totalPoints > 12) return prev;

      return {
        ...prev,
        attributes: { ...prev.attributes, [attr]: newValue },
        pointsRemaining: 12 - totalPoints,
      };
    });
  };

  const handleNext = () => {
    if (step === 1 && !formData.name.trim()) return;
    if (step === 4 && formData.pointsRemaining > 0) return;
    setStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    const selectedOrigin = ORIGINS.find(o => o.id === formData.origin);
    const selectedHistory = HISTORIES.find(h => h.id === formData.history);
    const attributes = { ...formData.attributes };
    if (selectedOrigin?.bonus) {
      for (const [k, v] of Object.entries(selectedOrigin.bonus)) {
        if (k in attributes) attributes[k as keyof typeof attributes] += v;
      }
    }
    if (selectedOrigin?.penalty) {
      for (const [k, v] of Object.entries(selectedOrigin.penalty)) {
        if (k in attributes) attributes[k as keyof typeof attributes] += v;
      }
    }
    const character = {
      name: formData.name,
      origin: formData.origin,
      history: formData.history,
      seenGate: formData.seenGate,
      appearance: formData.appearance,
      attributes,
      skills: selectedHistory?.skills || [],
      hp: 100,
      maxHp: 100,
      stress: 0,
      maxStress: 100,
      sanity: 100,
      maxSanity: 100,
    };

    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(character),
      });
      const data = await res.json();
      onComplete({ ...character, id: data.id });
    } catch (e) {
      console.error('Error creating character:', e);
      onComplete({ ...character, id: Date.now() });
    }
  };

  const steps = [
    () => (
      <div className="space-y-6">
        <h3 className="text-fmab-gold font-serif text-xl">¿Cómo te llamas, alquimista?</h3>
        <input
          type="text"
          value={formData.name}
          onChange={e => handleChange('name', e.target.value)}
          placeholder="Tu nombre..."
          className="w-full bg-fmab-darker border border-fmab-border rounded px-4 py-3 text-fmab-parchment font-serif text-lg focus:outline-none focus:ring-2 focus:ring-fmab-gold"
          autoFocus
        />
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.seenGate}
            onChange={e => handleChange('seenGate', e.target.checked)}
            className="w-4 h-4 border-fmab-border bg-fmab-darker text-fmab-gold rounded focus:ring-fmab-gold"
          />
          <span className="text-fmab-parchment">Has visto la Puerta de la Verdad (puedes transmutar sin círculo, pero +estrés base)</span>
        </label>
      </div>
    ),
    () => (
      <div className="space-y-4">
        <h3 className="text-fmab-gold font-serif text-xl">¿De qué tierra vienes?</h3>
        <div className="grid gap-3">
          {ORIGINS.map(o => (
            <button
              key={o.id}
              onClick={() => handleChange('origin', o.id)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                formData.origin === o.id
                  ? 'border-fmab-gold bg-fmab-gold/10'
                  : 'border-fmab-border hover:border-fmab-gold/50'
              }`}>
              <div className="font-bold text-fmab-parchment">{o.name}</div>
              <div className="text-sm text-fmab-steel">{o.desc}</div>
              <div className="text-xs text-fmab-goldLight mt-1">
                Bonus: {Object.entries(o.bonus).map(([k, v]) => `${k.toUpperCase()} +${v}`).join(', ')}
                {o.penalty && ` | Penalty: ${Object.entries(o.penalty).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(', ')}`}
              </div>
            </button>
          ))}
        </div>
      </div>
    ),
    () => (
      <div className="space-y-4">
        <h3 className="text-fmab-gold font-serif text-xl">¿Cuál es tu historia?</h3>
        <div className="grid gap-3">
          {HISTORIES.map(h => (
            <button
              key={h.id}
              onClick={() => handleChange('history', h.id)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                formData.history === h.id
                  ? 'border-fmab-gold bg-fmab-gold/10'
                  : 'border-fmab-border hover:border-fmab-gold/50'
              }`}>
              <div className="font-bold text-fmab-parchment">{h.name}</div>
              <div className="text-sm text-fmab-steel">{h.desc}</div>
              <div className="text-xs text-fmab-goldLight mt-1">
                Habilidades: {h.skills.join(', ')}
              </div>
            </button>
          ))}
        </div>
      </div>
    ),
    () => (
      <div className="space-y-6">
        <h3 className="text-fmab-gold font-serif text-xl">
          Distribuye tus <span className="text-fmab-goldLight">{formData.pointsRemaining}</span> puntos de atributo
        </h3>
        <p className="text-fmab-steel text-sm">Base: 10. Mín: 6. Máx: 18. Cada punto sobre 10 cuesta 1.</p>
        <div className="grid grid-cols-2 gap-4">
          {renderAttributeRows(formData, handleAttributeChange)}
        </div>
      </div>
    ),
    () => (
      <div className="space-y-6">
        <h3 className="text-fmab-gold font-serif text-xl">Apariencia</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-fmab-steel text-sm mb-1">Rostro</label>
            <input
              type="text"
              value={formData.appearance.face}
              onChange={e => handleChange('appearance', { ...formData.appearance, face: e.target.value })}
              placeholder="Describe tu rostro..."
              className="w-full bg-fmab-darker border border-fmab-border rounded px-3 py-2 text-fmab-parchment focus:outline-none focus:ring-2 focus:ring-fmab-gold"
            />
          </div>
          <div>
            <label className="block text-fmab-steel text-sm mb-1">Cicatrices (separadas por comas)</label>
            <input
              type="text"
              value={formData.appearance.scars.join(', ')}
              onChange={e => handleChange('appearance', { ...formData.appearance, scars: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="ej: quemadura en mano izquierda, corte en mejilla"
              className="w-full bg-fmab-darker border border-fmab-border rounded px-3 py-2 text-fmab-parchment focus:outline-none focus:ring-2 focus:ring-fmab-gold"
            />
          </div>
          <div>
            <label className="block text-fmab-steel text-sm mb-1">Vestimenta</label>
            <input
              type="text"
              value={formData.appearance.clothing}
              onChange={e => handleChange('appearance', { ...formData.appearance, clothing: e.target.value })}
              placeholder="¿Qué llevas puesto?"
              className="w-full bg-fmab-darker border border-fmab-border rounded px-3 py-2 text-fmab-parchment focus:outline-none focus:ring-2 focus:ring-fmab-gold"
            />
          </div>
          <div>
            <label className="block text-fmab-steel text-sm mb-1">Automail (opcional)</label>
            <input
              type="text"
              value={formData.appearance.automail}
              onChange={e => handleChange('appearance', { ...formData.appearance, automail: e.target.value })}
              placeholder="ej: brazo derecho, pierna izquierda"
              className="w-full bg-fmab-darker border border-fmab-border rounded px-3 py-2 text-fmab-parchment focus:outline-none focus:ring-2 focus:ring-fmab-gold"
            />
          </div>
        </div>
      </div>
    ),
  ];

  return (
    <div className="fmab-create max-w-2xl mx-auto bg-fmab-card border border-fmab-border rounded-xl p-8 animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl text-fmab-gold tracking-wider mb-2">CREACIÓN DE PERSONAJE</h1>
        <p className="text-fmab-steel">Fullmetal Alchemist: Brotherhood RPG</p>
      </div>

      <div className="flex justify-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map(n => (
          <div
            key={n}
            className={`w-8 h-1 rounded transition-colors ${
              n <= step ? 'bg-fmab-gold' : 'bg-fmab-border'
            }`}
          />
        ))}
      </div>

      <div className="min-h-[400px]">{steps[step - 1]()}</div>

      <div className="flex justify-between mt-8 pt-6 border-t border-fmab-border">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className="px-6 py-2 border border-fmab-border text-fmab-parchment rounded hover:bg-fmab-darker disabled:opacity-30 font-mono"
        >
          ← ATRÁS
        </button>
        <button
          onClick={step === 5 ? handleSubmit : handleNext}
          disabled={(step === 1 && !formData.name.trim()) || (step === 4 && formData.pointsRemaining > 0)}
          className="px-6 py-2 bg-fmab-gold text-fmab-darker font-bold rounded hover:bg-fmab-goldLight disabled:opacity-50 font-mono"
        >
          {step === 5 ? 'COMENZAR LA HISTORIA' : 'SIGUIENTE →'}
        </button>
      </div>
    </div>
  );
}