<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let email: string = '';
  let password: string = '';
  let isLoading: boolean = false;
  let errorMessage: string = '';
  let showPassword: boolean = false;

  const handleSubmit = async () => {
    try {
      errorMessage = '';
      isLoading = true;

      // Validate inputs
      if (!email || !password) {
        errorMessage = 'Email dan password harus diisi';
        isLoading = false; // jangan lupa set false
        return;
      }

      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'

        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login gagal');
      }else{
        console.log('Response:', data);
        console.log('Token received from login:', data.data.user.email);
        console.log('Token received is :', data.data.token);
      }

      // Successful login
      // You can redirect or store the token here
      console.log('Login berhasil:', data);

      // Example: store token and redirect
      localStorage.setItem('token', data.data.token);
      console.log('Token received from login:', data.token);
      // window.location.href = '/dashboard';
      goto('/profile');

    } catch (err) {
      const error = err as Error;
      console.error('Login error:', error);
      errorMessage = error.message || 'Terjadi kesalahan saat login';
    } finally {
      isLoading = false;
    }
  };

  const togglePasswordVisibility = () => {
    showPassword = !showPassword;
  };
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <!-- <div class="absolute top-8 text-center">
    <h1 class="text-4xl font-extrabold text-blue-600 drop-shadow-sm">Nexis University</h1>
    <p class="text-sm text-gray-500 mt-1">Inovasi. Ilmu. Masa Depan.</p>
  </div> -->
  <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
    <div class="text-center mb-6">
      <h1 class="text-3xl font-extrabold text-blue-700">Nexis University</h1>
      <p class="text-sm mb-4">Inovasi. Ilmu. Masa Depan.</p>
      <h2 class="mt-6 text-3xl font-bold text-gray-900">Login</h2>
      <p class="mt-2 text-sm text-gray-600">Silakan masuk ke akun Anda</p>
    </div>

    <form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
      {#if errorMessage}
        <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p class="text-sm text-red-700">{errorMessage}</p>
        </div>
      {/if}

      <div class="rounded-md -space-y-px">
        <div class="mb-4">
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              bind:value={email}
              required
              class="appearance-none rounded-md block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="email@example.com"
            />
          </div>
        </div>

        <div class="mb-2">
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
              </svg>
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              bind:value={password}
              required
              class="appearance-none rounded-md block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Password"
            />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                on:click={togglePasswordVisibility}
                class="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                {#if showPassword}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                  </svg>
                {/if}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="remember-me" class="ml-2 block text-sm text-gray-900">
            Ingat saya
          </label>
        </div>

        <div class="text-sm">
          <a href="#" class="font-medium text-blue-600 hover:text-blue-500">
            Lupa password?
          </a>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
        >
          {#if isLoading}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          {:else}
            Login
          {/if}
        </button>
      </div>

      <div class="text-center mt-4">
        <p class="text-sm text-gray-600">
          Belum punya akun?
          <a href="#register" class="font-medium text-blue-600 hover:text-blue-500">
            Daftar disini
          </a>
        </p>
      </div>
    </form>
  </div>
</div>

<style>
  /* Add custom styles here if needed */
</style>