<script setup lang="ts">
import { ref } from 'vue'
import NavBar from '@/components/NavBar.vue'

const activeTab = ref<'mentions' | 'privacy' | 'cgu'>('mentions')

const tabs = [
  { key: 'mentions' as const, label: 'Mentions légales' },
  { key: 'privacy' as const, label: 'Politique de confidentialité' },
  { key: 'cgu' as const, label: 'CGU' },
]
</script>

<template>
  <div class="min-h-screen bg-background">
    <NavBar />

    <main class="mx-auto max-w-3xl px-4 sm:px-10 py-8">
      <h1 class="text-2xl sm:text-3xl font-bold text-foreground mb-6">Informations légales</h1>

      <!-- Tabs -->
      <div class="flex gap-1 mb-8 border-b border-border pb-px">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === tab.key
              ? 'border-primary text-primary'
              : 'border-transparent text-foreground-muted hover:text-foreground',
          ]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Mentions légales -->
      <div v-if="activeTab === 'mentions'" class="space-y-6 text-sm text-foreground-muted leading-relaxed">
        <section>
          <h2 class="text-lg font-bold text-foreground mb-3">Mentions légales</h2>
          <div class="rounded-xl border border-border bg-surface p-5 space-y-4">
            <div>
              <h3 class="text-sm font-semibold text-foreground mb-1">Nom du site</h3>
              <p>TierTogether</p>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-foreground mb-1">URL</h3>
              <p>
                <a href="https://tiertogether.fr" class="text-primary hover:underline">https://tiertogether.fr</a>
              </p>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-foreground mb-1">Hébergeur</h3>
              <p>Hostinger International Ltd.</p>
              <p>61 Lordou Vironos st., 6023 Larnaca, Chypre</p>
              <p>
                <a href="https://www.hostinger.fr" class="text-primary hover:underline">https://www.hostinger.fr</a>
              </p>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-foreground mb-1">Contact</h3>
              <p>
                <a href="mailto:support@tiertogether.fr" class="text-primary hover:underline">support@tiertogether.fr</a>
              </p>
            </div>
          </div>
        </section>
      </div>

      <!-- Politique de confidentialité -->
      <div v-if="activeTab === 'privacy'" class="space-y-6 text-sm text-foreground-muted leading-relaxed">
        <section>
          <h2 class="text-lg font-bold text-foreground mb-3">Politique de confidentialité</h2>
          <div class="rounded-xl border border-border bg-surface p-5 space-y-5">
            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">Données collectées</h3>
              <ul class="list-disc list-inside space-y-1">
                <li>Adresse e-mail (inscription par e-mail)</li>
                <li>Pseudo / nom d'affichage</li>
                <li>Informations du profil Google (si connexion via Google OAuth) : nom, avatar, adresse e-mail</li>
              </ul>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">Cookies</h3>
              <p>
                TierTogether utilise uniquement un cookie d'authentification (JWT httpOnly) nécessaire au bon
                fonctionnement du service. Aucun cookie de tracking ou d'analyse n'est utilisé.
              </p>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">Tracking et analytics</h3>
              <p>
                Aucun outil de tracking, d'analytics ou de publicité n'est intégré au site. Nous ne collectons aucune
                donnée de navigation.
              </p>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">Stockage des données</h3>
              <p>
                Les données sont stockées sur un serveur VPS situé en France (Paris), hébergé par Hostinger.
              </p>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">E-mails transactionnels</h3>
              <p>
                Nous utilisons le service Resend pour l'envoi d'e-mails transactionnels uniquement (vérification
                d'adresse e-mail, réinitialisation de mot de passe). Aucun e-mail marketing n'est envoyé.
              </p>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">Droit de suppression</h3>
              <p>
                Vous pouvez demander la suppression de votre compte et de vos données personnelles en contactant
                <a href="mailto:support@tiertogether.fr" class="text-primary hover:underline">support@tiertogether.fr</a>.
              </p>
            </div>
          </div>
        </section>
      </div>

      <!-- CGU -->
      <div v-if="activeTab === 'cgu'" class="space-y-6 text-sm text-foreground-muted leading-relaxed">
        <section>
          <h2 class="text-lg font-bold text-foreground mb-3">Conditions Générales d'Utilisation</h2>
          <div class="rounded-xl border border-border bg-surface p-5 space-y-5">
            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">Objet</h3>
              <p>
                Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du site
                TierTogether, accessible à l'adresse
                <a href="https://tiertogether.fr" class="text-primary hover:underline">https://tiertogether.fr</a>.
                En utilisant le site, vous acceptez les présentes conditions sans réserve.
              </p>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">Service</h3>
              <p>
                TierTogether est un service gratuit permettant de créer des tier lists collaboratives en temps réel.
                Le service est fourni « en l'état », sans garantie de disponibilité, de performance ou de pérennité.
              </p>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">Responsabilité de l'utilisateur</h3>
              <p>
                L'utilisateur est seul responsable du contenu qu'il publie sur la plateforme (titres, images, messages
                de chat). Tout contenu illégal, diffamatoire, discriminatoire, pornographique ou portant atteinte aux
                droits de tiers est strictement interdit.
              </p>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">Modération et suspension</h3>
              <p>
                Nous nous réservons le droit de supprimer tout contenu contraire aux présentes CGU et de suspendre ou
                supprimer tout compte utilisateur en cas de violation, sans préavis ni indemnité.
              </p>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">Propriété intellectuelle</h3>
              <p>
                Les contenus créés par les utilisateurs (tier lists, images importées) restent la propriété de leurs
                auteurs respectifs. Le code source et le design du site sont la propriété de TierTogether.
              </p>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">Modification des CGU</h3>
              <p>
                Nous nous réservons le droit de modifier les présentes CGU à tout moment. Les modifications prendront
                effet dès leur publication sur le site. Il appartient à l'utilisateur de consulter régulièrement
                cette page.
              </p>
            </div>
          </div>
        </section>
      </div>

      <!-- Footer -->
      <footer class="border-t border-border mt-12 py-6 text-center text-xs text-foreground-subtle">
        <div class="flex items-center justify-center gap-4">
          <a href="mailto:support@tiertogether.fr" class="hover:text-foreground transition-colors">Contact</a>
          <span>&middot;</span>
          <span>&copy; 2026 TierTogether</span>
        </div>
      </footer>
    </main>
  </div>
</template>
