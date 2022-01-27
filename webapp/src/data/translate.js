const translations = {
  es: {
    dashboard: {
      messageSyncStatus: 'Usuario sincronizado 👏',
      messageNotSyncStatus: '¡Tu usuario no está sincronizado!',
      messageSync: 'Usuario sincronizado correctamente',
      messageNotSync: 'Error al sincronizar el usuario',
      evaluationNotFound: 'Error no se encontró evaluaciones',
      userHaventEvaluations: 'Usted aún no tiene evaluaciones',
      histogramTitle: 'Historico de evaluaciones',
      pentagramGraph: 'Vision general por año',
      searchPlaceholder: 'Buscar Evaluaciones',
      administration: 'Administración',
      romboTitle: 'Vision general por año',
      alreadyExists: '¡El elemente ya existe!',
      unasigned: 'No asignados',
      golbalView: 'Visión general',
    },
    AdminUsers: {
      searchPlaceholder: 'Buscar developers',
      title: 'Mis Developers',
      columnName: 'Nombre',
      columnType: 'Tipo',
      columnCharge: 'Cargo',
      columnLevel: 'Nível',
      columnActive: 'Activo',
      daysLeftMessage: 'Proximo cambio de funcción disponible en: ',
      allChecksNotAllowedMsg: '¡Solo se puede chequear todas las skills si el tiempo minimo de permanencia se ha cumprido!',
    },
    AdminEvaluations: {
      evaluations: 'Evaluaciones',
      evaluation: 'Evaluacion',
      searchPlaceholder: 'Buscar evaluaciones',
      title: 'Administración de evaluaciones',
      columnName: 'Name',
      columnDate: 'Fecha',
      columnEvaluation: 'Evaluation',
      columnActive: 'Activo',
      abaGeneral: 'General',
      abaPerformance: 'Desempeño',
      abaHumanFactor: 'Factor Humano',
      abaSkills: 'Habilidades',
      performanceArray: [
        'Responsabilidad',
        'Exactitud y calidad',
        'Entregas en fecha',
        'Productividad',
        'Orden y claridad del trabajo',
        'Status de su trabajo',
        'Capacidad de realización',
        'Comprensión de situaciones',
        'Sentido Común',
        'Cumplimiento de los procedimientos existentes',
        'Grado de Conocimiento Técnico',
        'Grado de Conocimiento funcional',
      ],
      HumanFactorArray: [
        'Actitud hacia la Empresa',
        'Actitud hacia superiores',
        'Actitud hacia los Compañeros',
        'Actitud con el cliente',
        'Cooperación con el equipo',
        'Capacidad de aceptar críticas',
        'Capacidad de generar sugerencias constructivas',
        'Predisposición',
      ],
      skillsArray: [
        'Iniciativa',
        'Creatividad',
        'Adaptabilidad',
        'Respuesta bajo presión',
        'Capacidad de manejar múltiples tareas',
        'Coordinación y Liderazgo',
        'Potencialidad',
      ],
    },
    AdminTechnologies: {
      placeholder:'Adicionar nueva tecnología',
      tableHeaders: ['id', 'nombre', 'plataforma', ''],
      title: 'Tecnologías en Lexart',
      success: '¡Operación completada con suceso!',
      error: 'No fue possible completar la operación.',
    },
    generic: {
      cancel: 'Cancelar',
      save: 'Guardar',
      date: 'Fecha',
      edit: 'Editar',
      remove: 'Borrar',
      topic: 'Topico',
      score: 'Puntaje',
      observations: 'Observaciones',
      yes: 'SI',
      no: 'NO',
      next: 'Próximo',
      back: 'Atrás',
      exit: 'Cerrar sección',
      technologies: 'Tecnologías',
      months: [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ],
      asignments: 'Atribuiciones',
      searchPlaceholderEvaluations: 'Buscar evaluaciones',
      Evaluations: 'Evaluaciones',
      Dashboard: 'Dashboard',
      performance: 'Desempeño',
      humanFactor: 'Factor humano',
      skills: 'Habilidades',
      lead: 'Liderazgo',
      leadTree: 'Mapa de Liderazgo',
      minimumTimeReached: '¡Nuevo cargo disponible!',
    },
    positionAssignments: {
      'EntryLevel Developer': [
        'Aprendizaje dentro de proyectos internos',
        'Evolución exponencial dentro de los tres meses de prueba',
        'Respetar horarios según disponibilidad pautada',
        'Proactividad para consultar dudas a programadores experimentados',
        'Comunicación activa',
      ],
      'FrontEnd Developer': [
        'Comprometimiento con tareas pautadas en proyecto',
        'Compromiso con el proyecto',
        'Evolución gradual sobre la tecnología del proyecto',
        'Respetar horarios según disponibilidad pautada',
        'Comunicación activa',
        'Reportar progreso de forma continua a managers',
      ],
      'FullStack Developer': [
        'Comprometimiento con tareas pautadas en proyecto',
        'Compromiso con el proyecto',
        'Autonomía en el proyecto',
        'Capacidad de decisión sobre el proyecto',
        'Respetar horarios según disponibilidad pautada',
        'Comunicación activa',
        'Evacuar dudas de programadores iniciantes',
        'Reportar progreso de forma continua a managers',
        'Ayudar a los managers para definición de tareas',
      ],
      'Jr. Software Architect': [
        'Comprometimiento con tareas pautadas en proyecto',
        'Compromiso con el proyecto',
        'Autonomía en el proyecto',
        'Capacidad de decisión sobre el proyecto',
        'Respetar horarios según disponibilidad pautada',
        'Comunicación activa',
        'Evacuar dudas de programadores',
        'Reportar progreso de forma continua a managers',
        'Ayudar a los managers para definición de tareas',
        'Capacitar a programadores iniciantes',
        'Mantenimiento de ambientes de FrontEnd',
      ],
      'Software Architect': [
        'Comprometimiento con tareas pautadas en proyecto',
        'Compromiso con el proyecto',
        'Autonomía en el proyecto',
        'Capacidad de decisión sobre el proyecto',
        'Respetar horarios según disponibilidad pautada',
        'Comunicación activa',
        'Evacuar dudas de programadores experimentados',
        'Reportar progreso de forma continua a managers',
        'Definición de tareas en proyectos',
        'Capacitar a programadores',
        'Mantenimiento de ambientes de FrontEnd/BackEnd y Base de datos',
        'Planificación de arquitectura de software de proyectos asignados',
        'Reportar a infraestructura necesidades de ambientes',
      ],
      'Lead Software Architect': [
        'Supervisión de procesos tecnológicos en los proyectos',
        'Autonomía para elección de tecnologías según el proyecto',
        'Capacidad de decisión',
        'Liderazgo de equipo',
        'Amplia disponibilidad horaria',
        'Comunicación proactiva',
        'Evacuar dudas de los arquitectos de software',
        'Definición de workflow técnico del proyecto',
        'Mentoría para programadores y arq. de software', 
        'Construcción de ambientes BackEnd/FrontEnd/Base de datos desde 0.',
        'Planificación de contingencia y control de riesgos',
        'Reportar a infraestructura necesidades tecnológicas y cambios de gran impacto',
        'Reportería activa de los proyectos al directorio de Lexart',
      ],
      'Solution Architect': [
        'Gestión y definición de procesos tecnológicos en los proyectos',
        'Elección de tecnologías según el proyecto',
        'Capacidad de decisión sobre presión y riesgo',
        'Liderazgo de equipo',
        'Amplia disponibilidad horaria',
        'Comunicación proactiva',
        'Evacuar dudas de los arquitectos de software',
        'Definición de workflow técnico del proyecto',
        'Mentoría para diversos equipos de la empresa',
        'Capacidad para transmitir las necesidades tecnologías a personal no idóneo en el asunto (Comercial, Marketing, etc)',
        'Capacidad para decidir cambios tecnológicos de grande impacto en conjunto con infraestructura',
        'Reportería activa de las decisiones al directorio',
      ],
    },
  },
  en: {
    dashboard: {
      messageSyncStatus: 'Synchronized user 👏',
      messageNotSyncStatus: 'Your user is not synced!',
      messageSync: 'User successfully synced',
      messageNotSync: 'Failed to sync user',
      evaluationNotFound: 'Error no reviews found',
      userHaventEvaluations: "You haven't evaluations yet",
      histogramTitle: 'Evaluation history',
      pentagramGraph: 'Overview by year',
      searchPlaceholder: 'Search Evaluations',
      administration: 'Administration',
      romboTitle: 'Overview by year',
      alreadyExists: 'This item already exists!',
      unasigned: 'Unasigneds',
      golbalView: 'Global Overview',
    },
    AdminUsers: {
      searchPlaceholder: 'Search developers',
      title: 'My Developers',
      columnName: 'Name',
      columnType: 'Type',
      columnCharge: 'Position',
      columnLevel: 'Level',
      columnActive: 'Active',
      daysLeftMessage: 'Next job change available in: ',
      allChecksNotAllowedMsg: 'A user can not be saved with all skills checked before the minimum trading position time',
    },
    AdminEvaluations: {
      evaluations: 'Evaluations',
      evaluation: 'Evaluation',
      searchPlaceholder: 'Search Evaluations',
      title: 'Assessment management',
      columnName: 'Name',
      columnDate: 'Date',
      columnEvaluation: 'Evaluation',
      columnActive: 'Active',
      abaGeneral: 'General',
      abaPerformance: 'Performance',
      abaHumanFactor: 'Human Factor',
      abaSkills: 'Skills',
      performanceArray: [
        'Responsibility',
        'Accuracy and quality',
        'Deliveries on date',
        'Productivity',
        'Order and clarity of work',
        'Status of your work',
        'Ability to perform',
        'Understanding of situations',
        'Common sense',
        'Compliance with existing procedures',
        'Degree of Technical Knowledge',
        'Degree of functional knowledge',
      ],
      HumanFactorArray: [
        'Attitude towards the Company',
        'Attitude towards superiors',
        'Attitude towards Companions',
        'Attitude towards the client',
        'Cooperation with the team',
        'Ability to accept criticism',
        'Ability to generate constructive suggestions',
        'Predisposition',
      ],
      skillsArray: [
        'Initiative',
        'Creativity',
        'Adaptability',
        'Response under pressure',
        'Ability to handle multiple tasks',
        'Coordination and Leadership',
        'Potentiality',
      ],
    },
    AdminTechnologies: {
      placeholder:'Add a new technology',
      tableHeaders: ['id', 'name', 'plataform', ''],
      title: 'Lexart stack',
      success: 'Operation ran sucessfully',
      error: 'Error when saving this operation',
    },
    generic: {
      cancel: 'Cancel',
      save: 'Save',
      date: 'Date',
      edit: 'Edit',
      remove: 'Delete',
      topic: 'Topic',
      score: 'Score',
      observations: 'Observations',
      yes: 'YES',
      no: 'NO',
      next: 'Next',
      back: 'Bcak',
      exit: 'Log out',
      technologies: 'Technologies',
      months: [
        "January",
        "February",
        "March",
        "April",
        "may",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      asignments: 'Asignments',
      searchPlaceholderEvaluations: 'Search evaluations',
      Evaluations: 'Evaluations',
      Dashboard: 'Dashboard',
      performance: 'Performance',
      humanFactor: 'Human Factor',
      skills: 'Skills',
      lead: 'Lead',
      leadTree: 'Lead\'s Tree',
      minimumTimeReached: 'New position available!',
    },
    positionAssignments: {
      'EntryLevel Developer': [
        'Learning within internal projects',
        'Exponential evolution within three months of testing',
        'Respect schedules according to scheduled availability',
        'Proactivity to consult doubts with experienced programmers',
        'Active communication',
      ],
      'FrontEnd Developer': [
        'Commitment to tasks scheduled in the project',
        'Commitment to the project',
        'Gradual evolution on project technology',
        'Respect schedules according to scheduled availability',
        'Active communication',
        'Report progress continuously to managers',
      ],
      'FullStack Developer': [
        'Commitment to tasks scheduled in the project',
        'Commitment to the project',
        'Autonomy in the project',
        'Decision-making capacity about the project',
        'Respect schedules according to scheduled availability',
        'Active communication',
        'Evacuate doubts from beginning programmers',
        'Report progress continuously to managers',
        'Help managers to define tasks',
      ],
      'Jr. Software Architect': [
        'Commitment to tasks scheduled in the project',
        'Commitment to the project',
        'Autonomy in the project',
        'Decision-making capacity about the project',
        'Respect schedules according to scheduled availability',
        'Active communication',
        'Evacuate doubts from programmers',
        'Report progress continuously to managers',
        'Help managers to define tasks',
        'Train Beginning Programmers',
        'Maintenance of FrontEnd environments',
      ],
      'Software Architect': [
        'Commitment to tasks scheduled in the project',
        'Commitment to the project',
        'Autonomy in the project',
        'Decision-making capacity about the project',
        'Respect schedules according to scheduled availability',
        'Active communication',
        'Evacuate doubts from experienced programmers',
        'Report progress continuously to managers',
        'Definition of tasks in projects',
        'Train programmers',
        'Maintenance of FrontEnd / BackEnd and Database environments',
        'Software architecture planning of assigned projects',
        'Report environment needs to infrastructure',
      ],
      'Lead Software Architect': [
        'Supervision of technological processes in projects',
        'Autonomy to choose technologies according to the project',
        'Decision capacity',
        'Team leadership',
        'Wide time availability',
        'Proactive communication',
        'Evacuate doubts from software architects',
        'Definition of project technical workflow',
        'Mentoring for programmers and arq. of software',
        'Construction of BackEnd / FrontEnd / Database environments from 0.',
        'Contingency planning and risk control',
        'Report technological needs and changes of great impact to infrastructure',
        'Active reporting of projects to the Lexart board',
      ],
      'Solution Architect': [
        'Management and definition of technological processes in projects',
        'Choice of technologies according to the project',
        'Decision-making capacity on pressure and risk',
        'Team leadership',
        'Wide time availability',
        'Proactive communication',
        'Evacuate doubts from software architects',
        'Definition of project technical workflow',
        'Mentoring for various teams in the company',
        'Ability to transmit technology needs to unsuitable personnel in the matter (Commercial, Marketing, etc.)',
        'Ability to decide technological changes of great impact in conjunction with infrastructure',
        'Active reporting of decisions to the board',
      ],
    },
  },
  pt: {},
}

export default  translations;
