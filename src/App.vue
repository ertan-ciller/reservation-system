<script setup>
// Router view kullanacağımız için bu importlara gerek yok
</script>

<template>
  <router-view />
</template>

<style>
/* Global stiller */
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #e0e0e0;
  color: #e0e0e0;
}

* {
  box-sizing: border-box;
}

.app {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  /*padding: 0.5rem;*/
  overflow-x: hidden;
}

header {
  text-align: center;
  margin-bottom: 1rem;
  padding: 0 1rem;
  
}

header h1 {
  margin: 0;
  padding: 1rem 0;
  font-size: 1.8rem;
}

.stage-label {
  position: relative;
  width: 60%;
  min-width: 300px;
  height: 50px;
  margin: 0 auto 3rem;
  background: linear-gradient(90deg, #2c5282, #3182ce);
  border-radius: 8px 8px 0 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  z-index: 2;
}

.stage-label::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 100%;
  height: 10px;
  background: linear-gradient(180deg, rgba(49, 130, 206, 0.2), transparent);
  pointer-events: none;
}

main {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 0;
  overflow-x: hidden;
  position: relative;
}

@media screen and (max-width: 768px) {
  .app {
    /*padding: 0.25rem;*/
  }

  header {
    margin-bottom: 0.5rem;
  }

  header h1 {
    font-size: 1.5rem;
    padding: 0.5rem 0;
  }

  .stage-label {
    width: 80%;
    min-width: 250px;
    height: 35px;
    font-size: 1rem;
    margin-bottom: 2rem;
  }

  main {
    overflow-x: visible;
  }
}

@media screen and (max-width: 480px) {
  header h1 {
    font-size: 1.2rem;
  }

  .stage-label {
    width: 90%;
    min-width: 200px;
    height: 55px;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }

  .app {
    padding: 0;
  }
}
</style>
