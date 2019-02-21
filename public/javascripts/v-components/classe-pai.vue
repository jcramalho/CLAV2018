<template>
    <tr> 
        <th class="p-3"> Classe Pai: </th>
        <td class="p-3" v-if="nivel == 1"> Lista Consolidada </td>
        <td class="p-3 text-primary" v-else> 
            <a :href="'/classes/c'+pai.codigo"> {{ pai.codigo }} </a> 
            | - {{ pai.titulo }}
        </td>
    </tr>
</template>

<script>
    export default {
        props: {
            pai: Object, 
            nivel: Number
        },
        data: function () {
            return {
            };
        }
    }
</script>

<style>
</style>