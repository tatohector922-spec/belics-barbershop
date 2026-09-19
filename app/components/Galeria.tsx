'use client';
import { useState } from 'react';
import Image from 'next/image';

const cortes = [
  // Cortes de Cholo
  { id: 1, barbero: 'Cholo', src: '/WhatsApp Image 2026-09-18 at 5.50.11 PM.jpeg', alt: 'Corte por Cholo' },
  { id: 2, barbero: 'Cholo', src: '/WhatsApp Image 2026-09-18 at 5.50.11 PM (1).jpeg', alt: 'Corte por Cholo' },
  { id: 3, barbero: 'Cholo', src: '/WhatsApp Image 2026-09-18 at 5.50.11 PM (2).jpeg', alt: 'Corte por Cholo' },
  { id: 4, barbero: 'Cholo', src: '/WhatsApp Image 2026-09-18 at 5.50.11 PM (3).jpeg', alt: 'Corte por Cholo' },
  
  // Cortes de Eduardo
  { id: 5, barbero: 'Eduardo', src: '/WhatsApp Image 2026-09-18 at 5.50.11 PM (4).jpeg', alt: 'Corte por Eduardo' },
  { id: 6, barbero: 'Eduardo', src: '/WhatsApp Image 2026-09-18 at 5.50.11 PM (5).jpeg', alt: 'Corte por Eduardo' },
  { id: 7, barbero: 'Eduardo', src: '/WhatsApp Image 2026-09-18 at 5.50.11 PM (6).jpeg', alt: 'Corte por Eduardo' },
  
  // Cortes de Gordito Belics
  { id: 8, barbero: 'Gordito Belics', src: '/WhatsApp Image 2026-09-18 at 5.50.12 PM.jpeg', alt: 'Corte por Gordito Belics' },
  { id: 9, barbero: 'Gordito Belics', src: '/WhatsApp Image 2026-09-18 at 5.50.12 PM (1).jpeg', alt: 'Corte por Gordito Belics' },
  { id: 10, barbero: 'Gordito Belics', src: '/WhatsApp Image 2026-09-18 at 5.50.12 PM (2).jpeg', alt: 'Corte por Gordito Belics' },
];

const categorias = ['Todos', 'Cholo', 'Eduardo', 'Gordito Belics'];

export default function Galeria() {
  const [filtro, setFiltro] = useState('Todos');

  const cortesFiltrados = filtro === 'Todos' 
    ? cortes 
    : cortes.filter(corte => corte.barbero === filtro);

  return (
    <section className="py-16 bg-zinc-950 text-white" id="galeria">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-yellow-500">
            Nuestros Cortes
          </h2>
          <p className="mt-4 max-w-2xl text-xl mx-auto text-zinc-400">
            Conoce el estilo y la calidad de nuestros barberos.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categorias.map((categoria) => (
            <button
              key={categoria}
              onClick={() => setFiltro(categoria)}
              className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                filtro === categoria
                  ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {categoria}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cortesFiltrados.map((corte) => (
            <div 
              key={corte.id} 
              className="relative aspect-[4/5] overflow-hidden rounded-2xl group shadow-lg bg-zinc-900"
            >
              <Image
                src={corte.src}
                alt={corte.alt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <span className="text-yellow-500 font-bold text-sm tracking-wider uppercase">Barbero</span>
                <span className="text-white text-2xl font-bold">{corte.barbero}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}