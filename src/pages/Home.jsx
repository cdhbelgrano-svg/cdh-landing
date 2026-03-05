import React from 'react'
import Hero from '../components/Hero'
import MenuPreview from '../components/MenuPreview'
import Refill from '../components/Refill'
import Patagonia from '../components/Patagonia'
import RockNBurger from '../components/RockNBurger'
import Reviews from '../components/Reviews'
import VIPForm from '../components/VIPForm'
import Jobs from '../components/Jobs'
import FAQ from '../components/FAQ'
import WhatsAppButton from '../components/WhatsAppButton'

function Home() {
  return (
    <main className="w-full min-h-screen bg-cdh-black overflow-x-hidden selection:bg-cdh-orange selection:text-white">
      <Hero />
      <MenuPreview />
      <Refill />
      <Patagonia />
      <RockNBurger />
      <Reviews />
      <VIPForm />
      <Jobs />
      <FAQ />
      <WhatsAppButton />

      <footer className="py-8 bg-cdh-black text-center border-t border-white/5">
        <p className="text-gray-500 font-medium text-sm">
          © {new Date().getFullYear()} La Casa de la Hamburguesa - Sucursal Belgrano.
          <br className="md:hidden" /> Todos los derechos reservados.
        </p>
      </footer>
    </main>
  )
}

export default Home
