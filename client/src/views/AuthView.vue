<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { Crown, Mail, Lock, User, ArrowLeft, KeyRound } from 'lucide-vue-next'

const router = useRouter()
const { loginWithGoogle, loginWithEmail, signup, verifyEmail, resendVerification, forgotPassword, resetPassword, authError, isLoading } = useAuth()

type AuthStep = 'login' | 'register' | 'verify' | 'forgot' | 'reset'
const step = ref<AuthStep>('login')

const email = ref('')
const password = ref('')
const newPassword = ref('')
const displayName = ref('')
const verificationCode = ref('')
const resetCode = ref('')
const resendCooldown = ref(false)
const resetCooldown = ref(false)
const localError = ref('')
const successMessage = ref('')

// Validations
const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
const passwordValid = computed(() => password.value.length >= 8)
const newPasswordValid = computed(() => newPassword.value.length >= 8)
const displayNameValid = computed(() => {
  const name = displayName.value.trim()
  return name.length >= 2 && name.length <= 20
})

const loginDisabled = computed(() => isLoading.value || !email.value || !password.value)
const registerDisabled = computed(() => isLoading.value || !emailValid.value || !passwordValid.value || !displayNameValid.value)

function clearErrors() {
  localError.value = ''
  successMessage.value = ''
}

async function handleLogin() {
  clearErrors()
  if (!email.value || !password.value) {
    localError.value = 'Veuillez remplir tous les champs'
    return
  }
  const result = await loginWithEmail(email.value, password.value)
  if (result.success) {
    router.push('/')
  } else if (result.needsVerification) {
    step.value = 'verify'
  }
}

async function handleRegister() {
  clearErrors()
  if (!displayNameValid.value) {
    localError.value = 'Le pseudo doit contenir entre 2 et 20 caractères'
    return
  }
  if (!emailValid.value) {
    localError.value = 'Veuillez entrer un email valide'
    return
  }
  if (!passwordValid.value) {
    localError.value = 'Le mot de passe doit contenir au moins 8 caractères'
    return
  }
  const result = await signup(email.value, password.value, displayName.value.trim())
  if (result.success) {
    step.value = 'verify'
  }
}

async function handleVerify() {
  clearErrors()
  if (verificationCode.value.length !== 6) {
    localError.value = 'Veuillez entrer le code à 6 chiffres'
    return
  }
  const result = await verifyEmail(email.value, verificationCode.value)
  if (result.success) {
    router.push('/')
  }
}

async function handleResend() {
  if (resendCooldown.value) return
  await resendVerification(email.value)
  resendCooldown.value = true
  setTimeout(() => { resendCooldown.value = false }, 30000)
}

async function handleForgotPassword() {
  clearErrors()
  if (!emailValid.value) {
    localError.value = 'Veuillez entrer un email valide'
    return
  }
  const result = await forgotPassword(email.value)
  if (result.success) {
    step.value = 'reset'
  }
}

async function handleResetPassword() {
  clearErrors()
  if (resetCode.value.length !== 6) {
    localError.value = 'Veuillez entrer le code à 6 chiffres'
    return
  }
  if (!newPasswordValid.value) {
    localError.value = 'Le mot de passe doit contenir au moins 8 caractères'
    return
  }
  const result = await resetPassword(email.value, resetCode.value, newPassword.value)
  if (result.success) {
    router.push('/')
  }
}

async function handleResendReset() {
  if (resetCooldown.value) return
  await forgotPassword(email.value)
  resetCooldown.value = true
  setTimeout(() => { resetCooldown.value = false }, 30000)
}

const displayError = computed(() => localError.value || authError.value)
</script>

<template>
  <div class="noise-bg flex min-h-screen flex-col bg-background">
    <!-- Top bar -->
    <div class="flex items-center justify-between px-4 py-3">
      <router-link to="/" class="flex items-center gap-2 group">
        <Crown class="h-5 w-5 text-primary transition-transform group-hover:rotate-12" :stroke-width="2.5" />
        <span class="text-lg font-bold tracking-tight text-foreground">TierTogether</span>
      </router-link>
    </div>

    <!-- Main -->
    <main class="flex flex-1 items-center justify-center px-4 py-6">
      <div class="w-full max-w-sm">
        <div class="rounded-2xl border border-border-hover bg-surface/50 p-6 sm:p-8 shadow-2xl shadow-black/50">

          <!-- LOGIN -->
          <template v-if="step === 'login'">
            <div class="mb-6 text-center">
              <KeyRound class="mx-auto mb-3 h-8 w-8 text-primary" />
              <h1 class="text-xl font-bold text-foreground">Bon retour</h1>
              <p class="mt-1 text-sm text-foreground-muted">Connectez-vous à votre compte</p>
            </div>

            <div v-if="displayError" class="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {{ displayError }}
            </div>

            <form class="space-y-4" @submit.prevent="handleLogin">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-foreground-muted">E-mail</label>
                <div class="relative">
                  <Mail class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                  <input
                    v-model="email"
                    type="email"
                    placeholder="votre@email.com"
                    required
                    class="w-full rounded-lg border border-border bg-surface-hover/80 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-subtle transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    @input="clearErrors"
                  />
                </div>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-medium text-foreground-muted">Mot de passe</label>
                <div class="relative">
                  <Lock class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                  <input
                    v-model="password"
                    type="password"
                    placeholder="Votre mot de passe"
                    required
                    class="w-full rounded-lg border border-border bg-surface-hover/80 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-subtle transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    @input="clearErrors"
                  />
                </div>
                <button
                  type="button"
                  class="mt-1.5 text-xs text-primary hover:underline"
                  @click="step = 'forgot'; clearErrors()"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <button
                type="submit"
                :disabled="loginDisabled"
                class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/15 transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isLoading ? 'Connexion...' : 'Se connecter' }}
              </button>
            </form>

            <div class="my-5 flex items-center gap-3">
              <div class="h-px flex-1 bg-border-hover" />
              <span class="text-xs text-foreground-subtle">ou</span>
              <div class="h-px flex-1 bg-border-hover" />
            </div>

            <button
              class="w-full rounded-lg border border-border-hover bg-transparent px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-surface-hover"
              @click="loginWithGoogle"
            >
              <span class="inline-flex items-center gap-2">
                <svg class="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuer avec Google
              </span>
            </button>

            <p class="mt-5 text-center text-sm text-foreground-muted">
              Pas encore de compte ?
              <button class="text-primary hover:underline" @click="step = 'register'; clearErrors()">Créer un compte</button>
            </p>
          </template>

          <!-- REGISTER -->
          <template v-if="step === 'register'">
            <div class="mb-6 text-center">
              <User class="mx-auto mb-3 h-8 w-8 text-primary" />
              <h1 class="text-xl font-bold text-foreground">Créer un compte</h1>
              <p class="mt-1 text-sm text-foreground-muted">Rejoignez TierTogether</p>
            </div>

            <div v-if="displayError" class="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {{ displayError }}
            </div>

            <form class="space-y-4" @submit.prevent="handleRegister">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-foreground-muted">Pseudo</label>
                <div class="relative">
                  <User class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                  <input
                    v-model="displayName"
                    type="text"
                    placeholder="2-20 caractères"
                    maxlength="20"
                    required
                    class="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-subtle transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                    :class="displayName && !displayNameValid ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-surface-hover/80 focus:border-primary/50'"
                    @input="clearErrors"
                  />
                </div>
                <p v-if="displayName && !displayNameValid" class="mt-1 text-xs text-destructive">
                  Doit contenir entre 2 et 20 caractères
                </p>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-medium text-foreground-muted">E-mail</label>
                <div class="relative">
                  <Mail class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                  <input
                    v-model="email"
                    type="email"
                    placeholder="votre@email.com"
                    required
                    class="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-subtle transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                    :class="email && !emailValid ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-surface-hover/80 focus:border-primary/50'"
                    @input="clearErrors"
                  />
                </div>
                <p v-if="email && !emailValid" class="mt-1 text-xs text-destructive">
                  Veuillez entrer un email valide
                </p>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-medium text-foreground-muted">Mot de passe</label>
                <div class="relative">
                  <Lock class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                  <input
                    v-model="password"
                    type="password"
                    placeholder="Min 8 caractères"
                    required
                    class="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-subtle transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                    :class="password && !passwordValid ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-surface-hover/80 focus:border-primary/50'"
                    @input="clearErrors"
                  />
                </div>
                <p v-if="password && !passwordValid" class="mt-1 text-xs text-destructive">
                  Doit contenir au moins 8 caractères
                </p>
              </div>

              <button
                type="submit"
                :disabled="registerDisabled"
                class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/15 transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isLoading ? 'Création...' : 'Créer le compte' }}
              </button>
            </form>

            <div class="my-5 flex items-center gap-3">
              <div class="h-px flex-1 bg-border-hover" />
              <span class="text-xs text-foreground-subtle">ou</span>
              <div class="h-px flex-1 bg-border-hover" />
            </div>

            <button
              class="w-full rounded-lg border border-border-hover bg-transparent px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-surface-hover"
              @click="loginWithGoogle"
            >
              <span class="inline-flex items-center gap-2">
                <svg class="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuer avec Google
              </span>
            </button>

            <p class="mt-5 text-center text-sm text-foreground-muted">
              Déjà un compte ?
              <button class="text-primary hover:underline" @click="step = 'login'; clearErrors()">Se connecter</button>
            </p>
          </template>

          <!-- VERIFY -->
          <template v-if="step === 'verify'">
            <button
              class="mb-4 inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground transition-colors"
              @click="step = 'login'; clearErrors()"
            >
              <ArrowLeft class="h-3.5 w-3.5" />
              Retour
            </button>

            <div class="mb-6 text-center">
              <Mail class="mx-auto mb-3 h-8 w-8 text-primary" />
              <h1 class="text-xl font-bold text-foreground">Vérifiez votre e-mail</h1>
              <p class="mt-1 text-sm text-foreground-muted">
                Nous avons envoyé un code à 6 chiffres à<br />
                <span class="font-medium text-foreground">{{ email }}</span>
              </p>
            </div>

            <div v-if="displayError" class="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {{ displayError }}
            </div>

            <form class="space-y-4" @submit.prevent="handleVerify">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-foreground-muted">Code de vérification</label>
                <input
                  v-model="verificationCode"
                  type="text"
                  inputmode="numeric"
                  placeholder="123456"
                  maxlength="6"
                  required
                  class="w-full rounded-lg border border-border bg-surface-hover/80 py-3 text-center text-lg font-mono tracking-[0.5em] text-foreground placeholder:text-foreground-subtle placeholder:tracking-[0.5em] transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  @input="clearErrors"
                />
              </div>

              <button
                type="submit"
                :disabled="isLoading || verificationCode.length < 6"
                class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/15 transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isLoading ? 'Vérification...' : 'Vérifier' }}
              </button>
            </form>

            <p class="mt-5 text-center text-sm text-foreground-muted">
              Vous n'avez pas reçu le code ?
              <button
                class="text-primary hover:underline disabled:text-foreground-subtle disabled:no-underline"
                :disabled="resendCooldown"
                @click="handleResend"
              >
                {{ resendCooldown ? 'Envoyé ! Attendez 30s' : 'Renvoyer' }}
              </button>
            </p>
          </template>

          <!-- FORGOT PASSWORD -->
          <template v-if="step === 'forgot'">
            <button
              class="mb-4 inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground transition-colors"
              @click="step = 'login'; clearErrors()"
            >
              <ArrowLeft class="h-3.5 w-3.5" />
              Retour à la connexion
            </button>

            <div class="mb-6 text-center">
              <KeyRound class="mx-auto mb-3 h-8 w-8 text-primary" />
              <h1 class="text-xl font-bold text-foreground">Mot de passe oublié</h1>
              <p class="mt-1 text-sm text-foreground-muted">Entrez votre e-mail pour recevoir un code de réinitialisation</p>
            </div>

            <div v-if="displayError" class="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {{ displayError }}
            </div>

            <form class="space-y-4" @submit.prevent="handleForgotPassword">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-foreground-muted">E-mail</label>
                <div class="relative">
                  <Mail class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                  <input
                    v-model="email"
                    type="email"
                    placeholder="votre@email.com"
                    required
                    class="w-full rounded-lg border border-border bg-surface-hover/80 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-subtle transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    @input="clearErrors"
                  />
                </div>
              </div>

              <button
                type="submit"
                :disabled="isLoading || !emailValid"
                class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/15 transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isLoading ? 'Envoi...' : 'Envoyer le code' }}
              </button>
            </form>
          </template>

          <!-- RESET PASSWORD -->
          <template v-if="step === 'reset'">
            <button
              class="mb-4 inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground transition-colors"
              @click="step = 'forgot'; clearErrors()"
            >
              <ArrowLeft class="h-3.5 w-3.5" />
              Retour
            </button>

            <div class="mb-6 text-center">
              <Mail class="mx-auto mb-3 h-8 w-8 text-primary" />
              <h1 class="text-xl font-bold text-foreground">Réinitialiser le mot de passe</h1>
              <p class="mt-1 text-sm text-foreground-muted">
                Nous avons envoyé un code à 6 chiffres à<br />
                <span class="font-medium text-foreground">{{ email }}</span>
              </p>
            </div>

            <div v-if="displayError" class="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {{ displayError }}
            </div>

            <form class="space-y-4" @submit.prevent="handleResetPassword">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-foreground-muted">Code de réinitialisation</label>
                <input
                  v-model="resetCode"
                  type="text"
                  inputmode="numeric"
                  placeholder="123456"
                  maxlength="6"
                  required
                  class="w-full rounded-lg border border-border bg-surface-hover/80 py-3 text-center text-lg font-mono tracking-[0.5em] text-foreground placeholder:text-foreground-subtle placeholder:tracking-[0.5em] transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  @input="clearErrors"
                />
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-medium text-foreground-muted">Nouveau mot de passe</label>
                <div class="relative">
                  <Lock class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                  <input
                    v-model="newPassword"
                    type="password"
                    placeholder="Min 8 caractères"
                    required
                    class="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-subtle transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                    :class="newPassword && !newPasswordValid ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-surface-hover/80 focus:border-primary/50'"
                    @input="clearErrors"
                  />
                </div>
                <p v-if="newPassword && !newPasswordValid" class="mt-1 text-xs text-destructive">
                  Doit contenir au moins 8 caractères
                </p>
              </div>

              <button
                type="submit"
                :disabled="isLoading || resetCode.length < 6 || !newPasswordValid"
                class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/15 transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isLoading ? 'Réinitialisation...' : 'Réinitialiser' }}
              </button>
            </form>

            <p class="mt-5 text-center text-sm text-foreground-muted">
              Vous n'avez pas reçu le code ?
              <button
                class="text-primary hover:underline disabled:text-foreground-subtle disabled:no-underline"
                :disabled="resetCooldown"
                @click="handleResendReset"
              >
                {{ resetCooldown ? 'Envoyé ! Attendez 30s' : 'Renvoyer' }}
              </button>
            </p>
          </template>

        </div>
      </div>
    </main>
  </div>
</template>
