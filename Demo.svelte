<script>
  import data from './data'
</script>

<style>
  .container {
    position: relative;
    min-height: 100vh;
    max-height: 100vh;
    height: 100%;
  }
  .col {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    flex-wrap: nowrap;
    align-self: stretch;
  }

  :global(body) {
    background-color: #c7c8ca;
    min-height: 100%;
    margin: 0px;
  }
  #imgbox {
    position: relative;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    height: 520px;
    min-height: 520px;
    border: 1px solid grey;
  }
  #slider {
    position: absolute;
    top: -180px;
    border: 1px solid grey;
    position: absolute;
    left: -2500px;
    z-index: 1;
  }
  .dir {
    position: absolute;
    font-size: 25px;
    top: 10px;
    z-index: 5;
    color: #50617a;
  }
  #label {
    position: absolute;
    left: 30%;
    width: 40%;
    text-align: center;
    font-size: 25px;
    top: 10px;
    z-index: 5;
    color: #50617a;
  }
  .title {
    font-size: 1rem;
    color: #50617a;
    text-align: left;
    align-self: flex-start;
    margin-left: 15px;
    font-size: 0.9rem;
    /* font-family: times new roman; */
  }
  #timeline {
    flex: 1;
    width: 100%;
    border: 1px solid grey;
    overflow-y: scroll;
    overflow-x: hidden;
  }
  #arrow {
    position: absolute;
    left: 50%;
    height: 40px;
    width: 2px;
    background-color: #50617a;
    top: 60px;
    z-index: 5;
  }
</style>

<div class="container col">

  <div class="title">
    Toronto contstruction timeline - proof of concept for
    <a href="https://www.stephenvelasco.com/">stephen velasco</a>
  </div>

  <div id="timeline">
    {#each data as obj}
      <div style="margin-top:40px;">{obj.name}</div>
    {/each}
  </div>

  <div id="imgbox">
    <div id="label">Toronto City Hall</div>
    <div id="arrow" />
    <div class="dir" style="left:20px;">⭠N</div>
    <div class="dir" style="right:20px;">S⭢</div>
    <div id="slider">
      <img style="min-width:5000px;" src="./assets/from-west.jpeg" alt="" />
    </div>
  </div>
  <!-- <img style="min-width:5000px;" src="./assets/from-west.jpeg" alt="" /> -->
</div>
