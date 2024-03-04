<template>
    <div>
        <h2>
            <b>Burnout test</b>
            <p class="text-right">
                <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    data-toggle="modal"
                    data-target="#testModal"
                >
                    New test
                </button>
            </p>
        </h2>
        <br>
        <table class="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Score</th>
                    <th>Date</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1</td>
                    <td>40</td>
                    <td>16/02/2024</td>
                    <td>
                        <button class="btn btn-secondary">
                            See details
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
        <!-- Modal save -->
        <div class="modal" role="dialog" id="testModal">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title is-bold">
                        Test
                    </h5>
                    <button
                        type="button"
                        class="close"
                        data-dismiss="modal"
                        aria-label="Close"
                    >
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <table class="table">
                        <tbody>
                            <tr v-for="(qn, i) in questions" :key="i">
                                <td>{{ qn.q }}</td>
                                <td>
                                    <select class="form-control" style="width: 3.5rem; text-align: center;" name="" id="" v-model="qn.value">
                                        <option value="0">0</option>
                                        <option value="0">1</option>
                                        <option value="0">2</option>
                                        <option value="0">3</option>
                                        <option value="0">4</option>
                                        <option value="0">5</option>
                                        <option value="0">6</option>
                                    </select>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="modal-footer">
                    <button
                    type="button"
                    v-on:click="teamName = ''"
                    class="btn btn-secondary"
                    data-dismiss="modal"
                    >
                    {{ $t("generic.close") }}
                    </button>
                    <button
                    type="button"
                    class="btn btn-primary"
                    v-on:click="saveTeam"
                    data-dismiss="modal"
                    >
                    {{ $t("generic.save") }}
                    </button>
                </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                showNewTest: false,
                questions: [
                    {q: 'Me siento emocionalmente agotado\/a por mi trabajo', value: 0},
                    {q: 'Me siento cansado al final de la jornada de trabajo.', value: 0},
                    {q: 'Cuando me levanto por la mañana y me enfrento a otra jornada de trabajo me siento fatigado.', value: 0},
                    {q: 'Tengo facilidad para comprender como se sienten mis alumnos\/as.', value: 0},
                    {q: 'Creo que estoy tratando a algunos alumnos\/as como si fueran objetos impersonales.', value: 0},
                    {q: 'Siento que trabajar todo el día con alumnos\/as supone un gran esfuerzo y me cansa.', value: 0},
                    {q: 'Creo que trato con mucha eficacia los problemas de mis alumnos\/as.', value: 0},
                    {q: 'Siento que mi trabajo me está desgastando. Me siento quemado por mi trabajo.', value: 0},
                    {q: 'Creo que con mi trabajo estoy influyendo positivamente en la vida de mis alumnos\/as', value: 0},
                    {q: 'Me he vuelto más insensible con la gente desde que ejerzo la profesión docente.', value: 0},
                    {q: 'Pienso que este trabajo me está endureciendo emocionalmente.', value: 0},
                    {q: 'Me siento con mucha energía en mi trabajo.', value: 0},
                    {q: 'Me siento frustrado\/a en mi trabajo', value: 0},
                    {q: 'Creo que trabajo demasiado.', value: 0},
                    {q: 'No me preocupa realmente lo que les ocurra a algunos de mis alumnos\/as.', value: 0},
                    {q: 'Trabajar directamente con alumnos\/as me produce estrés', value: 0},
                    {q: 'Siento que puedo crear con facilidad un clima agradable con mis alumnos\/as.', value: 0},
                    {q: 'Me siento motivado después de trabajar en contacto con alumnos\/as', value: 0},
                    {q: 'Creo que consigo muchas cosas valiosas en este trabajo.', value: 0},
                    {q: 'Me siento acabado en mi trabajo, al límite de mis posibilidades.', value: 0},
                    {q: 'En mi trabajo trato los problemas emocionalmente con mucha calma.', value: 0},
                    {q: 'Creo que los alumnos\/as me culpan de algunos de sus problemas.', value: 0}
                ]
            };
        },
        methods: {
            openModal: function (){
                this.showNewTest = true
            }
        }
    };
</script>