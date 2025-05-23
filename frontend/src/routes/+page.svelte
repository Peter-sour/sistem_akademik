<script lang="ts">
  import { onMount } from 'svelte';

   let user: any = null;

  onMount(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await fetch('http://localhost:3000/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      user = await res.json();
    } else {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  });
  // Types
  type Professor = {
    id: string;
    nip: string;
    nama: string;
    email: string;
    fakultas: string;
    jurusan: string;
    foto: string;
    bidangKeahlian: string[];
  };

  type Student = {
    id: string;
    nim: string;
    nama: string;
    jurusan: string;
    semester: number;
    ipk: number;
  };

  type Course = {
    id: string;
    kode: string;
    nama: string;
    sks: number;
    semester: number;
  };

  type Grade = {
    id: string;
    mahasiswaId: string;
    mahasiswaNama: string;
    mataKuliahId: string;
    mataKuliahNama: string;
    nilai: number;
    grade: string;
  };

  // State management
  let activeTab: 'profil' | 'nilai' | 'mahasiswa' | 'matakuliah' = 'profil';
  let isLoading: boolean = false;
  let error: string | null = null;
  let showModal: boolean = false;
  let modalType: 'edit-profil' | 'input-nilai' | 'edit-nilai' = 'edit-profil';
  let searchQuery: string = '';
  let selectedCourse: string = '';
  let selectedSemester: number = 1;

  // Data
  let professor: Professor = {
    id: 'P001',
    nip: '199001012020121001',
    nama: 'Dr. Budi Santoso, M.Kom.',
    email: 'budi.santoso@nexis.ac.id',
    fakultas: 'Fakultas Ilmu Komputer',
    jurusan: 'Teknik Informatika',
    foto: '/api/placeholder/150/150',
    bidangKeahlian: ['Kecerdasan Buatan', 'Data Mining', 'Machine Learning']
  };

  let courses: Course[] = [
    { id: 'C001', kode: 'TI2021', nama: 'Algoritma dan Pemrograman', sks: 4, semester: 1 },
    { id: 'C002', kode: 'TI2022', nama: 'Basis Data', sks: 3, semester: 2 },
    { id: 'C003', kode: 'TI2023', nama: 'Kecerdasan Buatan', sks: 3, semester: 5 },
    { id: 'C004', kode: 'TI2024', nama: 'Pemrograman Web', sks: 3, semester: 3 },
    { id: 'C005', kode: 'TI2025', nama: 'Jaringan Komputer', sks: 4, semester: 4 }
  ];

  let students: Student[] = [
    { id: 'S001', nim: '2023100001', nama: 'Andi Wijaya', jurusan: 'Teknik Informatika', semester: 3, ipk: 3.75 },
    { id: 'S002', nim: '2023100002', nama: 'Siti Rahma', jurusan: 'Teknik Informatika', semester: 3, ipk: 3.85 },
    { id: 'S003', nim: '2023100003', nama: 'Rudi Hartono', jurusan: 'Teknik Informatika', semester: 3, ipk: 3.50 },
    { id: 'S004', nim: '2023100004', nama: 'Dewi Anggraini', jurusan: 'Teknik Informatika', semester: 3, ipk: 3.90 },
    { id: 'S005', nim: '2023100005', nama: 'Joko Prabowo', jurusan: 'Teknik Informatika', semester: 3, ipk: 3.25 }
  ];

  let grades: Grade[] = [
    { id: 'G001', mahasiswaId: 'S001', mahasiswaNama: 'Andi Wijaya', mataKuliahId: 'C001', mataKuliahNama: 'Algoritma dan Pemrograman', nilai: 85, grade: 'A-' },
    { id: 'G002', mahasiswaId: 'S002', mahasiswaNama: 'Siti Rahma', mataKuliahId: 'C001', mataKuliahNama: 'Algoritma dan Pemrograman', nilai: 90, grade: 'A' },
    { id: 'G003', mahasiswaId: 'S003', mahasiswaNama: 'Rudi Hartono', mataKuliahId: 'C001', mataKuliahNama: 'Algoritma dan Pemrograman', nilai: 75, grade: 'B+' },
    { id: 'G004', mahasiswaId: 'S004', mahasiswaNama: 'Dewi Anggraini', mataKuliahId: 'C001', mataKuliahNama: 'Algoritma dan Pemrograman', nilai: 95, grade: 'A' },
    { id: 'G005', mahasiswaId: 'S005', mahasiswaNama: 'Joko Prabowo', mataKuliahId: 'C001', mataKuliahNama: 'Algoritma dan Pemrograman', nilai: 70, grade: 'B' }
  ];

  let filteredStudents: Student[] = [];
  let filteredGrades: Grade[] = [];
  let editingGrade: Grade | null = null;
  let editingProfile: Professor | null = null;
  let newGrade: Omit<Grade, 'id' | 'mahasiswaNama' | 'mataKuliahNama' | 'grade'> & { mahasiswaNama?: string, mataKuliahNama?: string } = {
    mahasiswaId: '',
    mataKuliahId: '',
    nilai: 0
  };

  // Lifecycle
  onMount(() => {
    // Simulate fetching data from server
    isLoading = true;
    setTimeout(() => {
      filteredStudents = [...students];
      filteredGrades = [...grades];
      isLoading = false;
    }, 500);
  });

  // Methods
  function switchTab(tab: typeof activeTab) {
    activeTab = tab;
    searchQuery = '';

    if (tab === 'mahasiswa') {
      filteredStudents = [...students];
    } else if (tab === 'nilai') {
      filteredGrades = [...grades];
      selectedCourse = '';
    }
  }

  function openEditProfileModal() {
    editingProfile = { ...professor };
    modalType = 'edit-profil';
    showModal = true;
  }

  function openInputGradeModal() {
    newGrade = {
      mahasiswaId: '',
      mataKuliahId: '',
      nilai: 0
    };
    modalType = 'input-nilai';
    showModal = true;
  }

  function openEditGradeModal(grade: Grade) {
    editingGrade = { ...grade };
    modalType = 'edit-nilai';
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingGrade = null;
    editingProfile = null;
  }

  function saveProfile() {
    if (editingProfile) {
      isLoading = true;
      // Simulate API call
      setTimeout(() => {
        professor = { ...editingProfile };
        closeModal();
        isLoading = false;
      }, 500);
    }
  }

  function saveGrade() {
    isLoading = true;

    // Simulate API call
    setTimeout(() => {
      if (modalType === 'input-nilai') {
        const student = students.find(s => s.id === newGrade.mahasiswaId);
        const course = courses.find(c => c.id === newGrade.mataKuliahId);

        if (student && course) {
          const gradeValue = calculateGrade(newGrade.nilai);

          const newGradeEntry: Grade = {
            id: `G${grades.length + 1}`,
            mahasiswaId: newGrade.mahasiswaId,
            mahasiswaNama: student.nama,
            mataKuliahId: newGrade.mataKuliahId,
            mataKuliahNama: course.nama,
            nilai: newGrade.nilai,
            grade: gradeValue
          };

          grades = [...grades, newGradeEntry];
          filteredGrades = [...grades];
        }
      } else if (modalType === 'edit-nilai' && editingGrade) {
        const gradeValue = calculateGrade(editingGrade.nilai);
        editingGrade.grade = gradeValue;

        grades = grades.map(g => g.id === editingGrade.id ? editingGrade : g);
        filteredGrades = filteredGrades.map(g => g.id === editingGrade.id ? editingGrade : g);
      }

      closeModal();
      isLoading = false;
    }, 500);
  }

  function calculateGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'E';
  }

  function searchStudents() {
    filteredStudents = students.filter(student =>
      student.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nim.includes(searchQuery)
    );
  }

  function filterGradesByCourse() {
    if (selectedCourse) {
      filteredGrades = grades.filter(grade => grade.mataKuliahId === selectedCourse);
    } else {
      filteredGrades = [...grades];
    }
  }

  function getStudentById(id: string): Student | undefined {
    return students.find(student => student.id === id);
  }

  function getCourseById(id: string): Course | undefined {
    return courses.find(course => course.id === id);
  }

  // Computed values
  $: totalStudents = students.length;
  $: totalCourses = courses.length;
  $: avgIpk = students.length > 0
    ? students.reduce((acc, student) => acc + student.ipk, 0) / students.length
    : 0;
</script>

<div class="min-h-screen bg-gray-100">
  <!-- Navbar -->
  <nav class="bg-blue-600 text-white shadow-lg">
    <div class="container mx-auto px-4 py-3 flex justify-between items-center">
      <div class="flex items-center">
        <h1 class="text-xl font-bold">Nexis University</h1>
        <span class="mx-2">|</span>
        <h2 class="text-lg">Portal Dosen</h2>
      </div>
      <div class="flex items-center">
        <span class="mr-4">{professor.nama}</span>
        <button class="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded-md text-sm">Logout</button>
      </div>
    </div>
  </nav>

  <!-- Main Content -->
  <div class="container mx-auto px-4 py-6">
    <!-- Tabs -->
    <div class="bg-white rounded-t-lg shadow-md mb-6 flex">
      <button
        class="px-6 py-3 text-sm font-medium {activeTab === 'profil' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
        on:click={() => switchTab('profil')}>
        Profil Dosen
      </button>
      <button
        class="px-6 py-3 text-sm font-medium {activeTab === 'nilai' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
        on:click={() => switchTab('nilai')}>
        Penilaian
      </button>
      <button
        class="px-6 py-3 text-sm font-medium {activeTab === 'mahasiswa' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
        on:click={() => switchTab('mahasiswa')}>
        Data Mahasiswa
      </button>
      <button
        class="px-6 py-3 text-sm font-medium {activeTab === 'matakuliah' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
        on:click={() => switchTab('matakuliah')}>
        Mata Kuliah
      </button>
    </div>

    <!-- Tab Content -->
    <div class="bg-white rounded-b-lg shadow-md p-6">
      {#if isLoading}
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      {:else if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span class="block sm:inline">{error}</span>
        </div>
      {:else}
        <!-- Profil Tab -->
        {#if activeTab === 'profil'}
          <div class="flex flex-col md:flex-row">
            <div class="w-full md:w-1/3 flex flex-col items-center p-4">
              <img src={professor.foto} alt={professor.nama} class="rounded-full w-32 h-32 object-cover border-4 border-blue-200 mb-4" />
              <h2 class="text-xl font-bold text-gray-800">{professor.nama}</h2>
              <p class="text-gray-600">NIP: {professor.nip}</p>
              <p class="text-gray-600">{professor.email}</p>
              <button
                class="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                on:click={openEditProfileModal}>
                Edit Profil
              </button>
            </div>
            <div class="w-full md:w-2/3 p-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-blue-50 p-4 rounded-lg">
                  <h3 class="font-semibold text-gray-700 mb-2">Informasi Akademik</h3>
                  <div class="mb-3">
                    <p class="text-sm text-gray-500">Fakultas</p>
                    <p class="text-gray-800">{professor.fakultas}</p>
                  </div>
                  <div class="mb-3">
                    <p class="text-sm text-gray-500">Jurusan</p>
                    <p class="text-gray-800">{professor.jurusan}</p>
                  </div>
                </div>
                <div class="bg-blue-50 p-4 rounded-lg">
                  <h3 class="font-semibold text-gray-700 mb-2">Bidang Keahlian</h3>
                  <div class="flex flex-wrap">
                    {#each professor.bidangKeahlian as keahlian}
                      <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2 mb-2">{keahlian}</span>
                    {/each}
                  </div>
                </div>
              </div>

              <div class="mt-6">
                <h3 class="font-semibold text-gray-700 mb-4">Ringkasan</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div class="flex items-center">
                      <div class="bg-blue-100 p-3 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">Total Mahasiswa</p>
                        <p class="text-xl font-semibold text-gray-800">{totalStudents}</p>
                      </div>
                    </div>
                  </div>
                  <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div class="flex items-center">
                      <div class="bg-green-100 p-3 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">Total Mata Kuliah</p>
                        <p class="text-xl font-semibold text-gray-800">{totalCourses}</p>
                      </div>
                    </div>
                  </div>
                  <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div class="flex items-center">
                      <div class="bg-purple-100 p-3 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">Rata-rata IPK</p>
                        <p class="text-xl font-semibold text-gray-800">{avgIpk.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Penilaian Tab -->
        {#if activeTab === 'nilai'}
          <div>
            <div class="flex flex-col md:flex-row justify-between items-center mb-6">
              <h2 class="text-lg font-semibold text-gray-800 mb-4 md:mb-0">Daftar Nilai Mahasiswa</h2>
              <div class="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
                <select
                  bind:value={selectedCourse}
                  on:change={filterGradesByCourse}
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
                  <option value="">Semua Mata Kuliah</option>
                  {#each courses as course}
                    <option value={course.id}>{course.nama}</option>
                  {/each}
                </select>
                <button
                  class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                  on:click={openInputGradeModal}>
                  Input Nilai Baru
                </button>
              </div>
            </div>

            {#if filteredGrades.length > 0}
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mahasiswa</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mata Kuliah</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai Angka</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                      <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    {#each filteredGrades as grade}
                      <tr>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm text-gray-900">{grade.mahasiswaNama}</div>
                          <div class="text-xs text-gray-500">
                            {getStudentById(grade.mahasiswaId)?.nim || ''}
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm text-gray-900">{grade.mataKuliahNama}</div>
                          <div class="text-xs text-gray-500">
                            {getCourseById(grade.mataKuliahId)?.kode || ''} • {getCourseById(grade.mataKuliahId)?.sks || ''} SKS
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm text-gray-900">{grade.nilai}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            {grade.grade.startsWith('A') ? 'bg-green-100 text-green-800' :
                            grade.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                            grade.grade.startsWith('C') ? 'bg-yellow-100 text-yellow-800' :
                            grade.grade.startsWith('D') ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'}">
                            {grade.grade}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            class="text-blue-600 hover:text-blue-900"
                            on:click={() => openEditGradeModal(grade)}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {:else}
              <div class="text-center py-10">
                <p class="text-gray-500">Belum ada data nilai yang tersedia.</p>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Mahasiswa Tab -->
        {#if activeTab === 'mahasiswa'}
          <div>
            <div class="flex flex-col md:flex-row justify-between items-center mb-6">
              <h2 class="text-lg font-semibold text-gray-800 mb-4 md:mb-0">Data Mahasiswa</h2>
              <div class="relative w-full md:w-64">
                <input
                  type="text"
                  bind:value={searchQuery}
                  placeholder="Cari mahasiswa..."
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10"
                  on:input={searchStudents}
                />
                <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
            </div>

            {#if filteredStudents.length > 0}
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each filteredStudents as student}
                  <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex items-start">
                      <div class="bg-blue-100 rounded-full p-3 mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 class="text-base font-semibold text-gray-800">{student.nama}</h3>
                        <p class="text-sm text-gray-600">NIM: {student.nim}</p>
                        <div class="mt-3 grid grid-cols-2 gap-2">
                          <div>
                            <p class="text-xs text-gray-500">Jurusan</p>
                            <p class="text-sm text-gray-700">{student.jurusan}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500">Semester</p>
                            <p class="text-sm text-gray-700">{student.semester}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500">IPK</p>
                            <p class="text-sm font-medium
                              {student.ipk >= 3.5 ? 'text-green-600' :
                              student.ipk >= 3.0 ? 'text-blue-600' :
                              student.ipk >= 2.5 ? 'text-yellow-600' :
                              'text-red-600'}">{student.ipk.toFixed(2)}</p>
                          </div>
                        </div>
                        <div class="mt-3">
                          <button class="text-xs text-blue-600 hover:text-blue-800 font-medium">Lihat Detail</button>
                        </div>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="text-center py-10">
                <p class="text-gray-500">Tidak ada data mahasiswa yang ditemukan.</p>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Mata Kuliah Tab -->
        {#if activeTab === 'matakuliah'}
          <div>
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-lg font-semibold text-gray-800">Daftar Mata Kuliah</h2>
              <select
                bind:value={selectedSemester}
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
                <option value={0}>Semua Semester</option>
                <option value={1}>Semester 1</option>
                <option value={2}>Semester 2</option>
                <option value={3}>Semester 3</option>
                <option value={4}>Semester 4</option>
                <option value={5}>Semester 5</option>
                <option value={6}>Semester 6</option>
                <option value={7}>Semester 7</option>
                <option value={8}>Semester 8</option>
              </select>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {#each courses.filter(c => selectedSemester === 0 || c.semester === selectedSemester) as course}
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div class="flex justify-between">
                    <div>
                      <h3 class="text-base font-semibold text-gray-800">{course.nama}</h3>
                      <p class="text-sm text-gray-600">Kode: {course.kode}</p>
                    </div>
                    <div class="flex items-center">
                      <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{course.sks} SKS</span>
                    </div>
                  </div>
                  <div class="mt-3 flex items-center">
                    <div class="bg-gray-100 rounded-full p-2 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">Semester {course.semester}</p>
                    </div>
                  </div>
                  <div class="mt-4 flex justify-end">
                    <button class="text-sm text-blue-600 hover:text-blue-800 font-medium">Lihat Mahasiswa</button>
                  </div>
                </div>
              {/each}
            </div>

            {#if courses.filter(c => selectedSemester === 0 || c.semester === selectedSemester).length === 0}
              <div class="text-center py-10">
                <p class="text-gray-500">Tidak ada mata kuliah untuk semester ini.</p>
              </div>
            {/if}
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<!-- Modals -->
{#if showModal}
  <!-- Modal Backdrop -->
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex justify-center items-center">
    <!-- Modal Content -->
    <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-screen overflow-y-auto">

      <!-- Modal Header -->
      <div class="px-6 py-4 border-b">
        <h3 class="text-lg font-medium text-gray-900">
          {#if modalType === 'edit-profil'}
            Edit Profil Dosen
          {:else if modalType === 'input-nilai'}
            Input Nilai Baru
          {:else if modalType === 'edit-nilai'}
            Edit Nilai Mahasiswa
          {/if}
        </h3>
      </div>

      <!-- Modal Body -->
      <div class="px-6 py-4">
        {#if modalType === 'edit-profil' && editingProfile}
          <div class="space-y-4">
            <div>
              <label for="nama" class="block text-sm font-medium text-gray-700">Nama Lengkap</label>
              <input
                type="text"
                id="nama"
                bind:value={editingProfile.nama}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label for="nip" class="block text-sm font-medium text-gray-700">NIP</label>
              <input
                type="text"
                id="nip"
                bind:value={editingProfile.nip}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                bind:value={editingProfile.email}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label for="fakultas" class="block text-sm font-medium text-gray-700">Fakultas</label>
              <input
                type="text"
                id="fakultas"
                bind:value={editingProfile.fakultas}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label for="jurusan" class="block text-sm font-medium text-gray-700">Jurusan</label>
              <input
                type="text"
                id="jurusan"
                bind:value={editingProfile.jurusan}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Bidang Keahlian</label>
              <div class="mt-1 flex flex-wrap gap-2">
                {#each editingProfile.bidangKeahlian as keahlian, i}
                  <div class="flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    <span>{keahlian}</span>
                    <button
                      class="ml-1.5 text-blue-600 hover:text-blue-800"
                      on:click={() => {
                        editingProfile.bidangKeahlian = editingProfile.bidangKeahlian.filter((_, idx) => idx !== i);
                      }}>
                      &times;
                    </button>
                  </div>
                {/each}
                <button
                  class="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full hover:bg-blue-100"
                  on:click={() => {
                    const keahlian = prompt('Masukkan bidang keahlian baru:');
                    if (keahlian && !editingProfile.bidangKeahlian.includes(keahlian)) {
                      editingProfile.bidangKeahlian = [...editingProfile.bidangKeahlian, keahlian];
                    }
                  }}>
                  + Tambah
                </button>
              </div>
            </div>
          </div>
        {:else if modalType === 'input-nilai'}
          <div class="space-y-4">
            <div>
              <label for="mahasiswa" class="block text-sm font-medium text-gray-700">Mahasiswa</label>
              <select
                id="mahasiswa"
                bind:value={newGrade.mahasiswaId}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="">Pilih Mahasiswa</option>
                {#each students as student}
                  <option value={student.id}>{student.nama} ({student.nim})</option>
                {/each}
              </select>
            </div>
            <div>
              <label for="matakuliah" class="block text-sm font-medium text-gray-700">Mata Kuliah</label>
              <select
                id="matakuliah"
                bind:value={newGrade.mataKuliahId}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="">Pilih Mata Kuliah</option>
                {#each courses as course}
                  <option value={course.id}>{course.nama} ({course.kode})</option>
                {/each}
              </select>
            </div>
            <div>
              <label for="nilai" class="block text-sm font-medium text-gray-700">Nilai (0-100)</label>
              <input
                type="number"
                id="nilai"
                min="0"
                max="100"
                bind:value={newGrade.nilai}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <p class="text-sm text-gray-600">Grade: <span class="font-semibold">{calculateGrade(newGrade.nilai)}</span></p>
            </div>
          </div>
        {:else if modalType === 'edit-nilai' && editingGrade}
          <div class="space-y-4">
            <div>
              <p class="text-sm font-medium text-gray-700">Mahasiswa</p>
              <p class="mt-1 text-gray-900">{editingGrade.mahasiswaNama}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-700">Mata Kuliah</p>
              <p class="mt-1 text-gray-900">{editingGrade.mataKuliahNama}</p>
            </div>
            <div>
              <label for="nilai-edit" class="block text-sm font-medium text-gray-700">Nilai (0-100)</label>
              <input
                type="number"
                id="nilai-edit"
                min="0"
                max="100"
                bind:value={editingGrade.nilai}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <p class="text-sm text-gray-600">Grade: <span class="font-semibold">{calculateGrade(editingGrade.nilai)}</span></p>
            </div>
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-4 border-t flex justify-end space-x-3">
        <button
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          on:click={closeModal}
          disabled={isLoading}>
          Batal
        </button>
        <button
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          on:click={modalType === 'edit-profil' ? saveProfile : saveGrade}
          disabled={isLoading}>
          {isLoading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </div>
  </div>
{/if}