<template>
    <div class="Admin">
      <Error/>
      <Tabs/>
    </div>
</template>

<script>
    import Tabs from './Tabs/Tabs'
    import Error from './Error/Error'
    export default {
      components: { Tabs, Error },
      props: {
        }
    };
</script>
