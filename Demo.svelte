<script>
  import columns from './data'
  import {
    Timeline,
    Label,
    Column,
    Ticks,
    Axis,
    Pill,
    Now
  } from '/Users/spencer/mountain/somehow-timeline/src'
  let screen = 1000
  // let columns = [[], [], [], [], []]

  // data.forEach((obj, i) => {
  //   let col = i % 5
  //   columns[col].push(obj)
  // })
  let left = 0
  const goTo = function(obj) {
    let half = screen / 2
    left = -1 * obj.x + half
    name = obj.name
    sub = obj.height + 'm'
  }
  let name = ''
  let sub = ''
  let list = [
    500,
    750,
    1000,
    1250,
    1500,
    1750,
    2000,
    2250,
    2500,
    2750,
    3000,
    3250,
    3500,
    3750,
    4000,
    4250,
    4500,
    4750,
    5000
  ]
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
    height: 370px;
    min-height: 370px;
    border-top: 4px solid #657da1;
  }
  #slider {
    position: absolute;
    top: -300px;
    position: absolute;
    /* left: -2500px; */
    z-index: 1;
    transition: left 0.8s;
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
    color: #657da1;
  }
  .title {
    font-size: 1rem;
    color: #657da1;
    text-align: left;
    align-self: flex-start;
    margin-left: 15px;
    font-size: 0.9rem;
    /* font-family: times new roman; */
  }
  #timelinescroll {
    flex: 1;
    width: 100%;
    overflow-y: scroll;
    overflow-x: hidden;
  }
  #timeline {
    margin-top: 2rem;
    margin-left: 10%;
    margin-right: 10%;
  }
  #arrow {
    position: absolute;
    left: 50%;
    height: 45px;
    width: 2px;
    background-color: #657da1;
    top: 60px;
    z-index: 5;
  }
  .sub {
    position: relative;
    color: grey;
    font-size: 1rem;
    margin-top: 2px;
    left: 38px;
  }
</style>

<svelte:window bind:innerWidth={screen} />

<div class="container col">

  <div class="title">
    <!-- <b>Toronto contstruction timeline</b> -->
    proof of concept for
    <a href="https://www.stephenvelasco.com/">stephen velasco</a>
    <div>mock construction timeline</div>
  </div>

  <div id="timelinescroll" style="max-width:1000px;">
    <div id="timeline">
      <Timeline start="jan 1 2008" end="Dec 30 2040" height="500">
        <Now />
        <Column>
          <Axis />
        </Column>
        {#each columns as col}
          <Column>
            {#each col as obj}
              <Pill
                width="20px"
                start={obj.start}
                end={obj.end}
                color={obj.construction ? '#86b3a7' : 'blue'}
                label={obj.name}
                onClick={() => goTo(obj)}
                opacity="0.8"
                size="1rem" />
            {/each}
          </Column>
        {/each}
      </Timeline>
    </div>

  </div>
  <div id="imgbox" style="overflow:hidden;">
    <div id="label">
      {name}
      <div class="sub">{sub}</div>
    </div>
    <div id="arrow" />
    <div class="dir" style="left:20px;">⭠N</div>
    <div class="dir" style="right:20px;">S⭢</div>
    <div id="slider" style="left:{left}px; ">

      <img style="min-width:5000px; " src="./assets/from-west.jpeg" alt="" />
    </div>
    <!-- <img style="min-width:5000px;" src="./assets/from-west.jpeg" alt="" /> -->
  </div>
</div>
