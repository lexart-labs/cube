const translations = {
  es: {
    dashboard: {
      messageSyncStatus: 'Usuario sincronizado',
      messageNotSyncStatus: '¡Tu usuario no está sincronizado!',
      messageSync: 'Usuario sincronizado correctamente',
      messageNotSync: 'Error al sincronizar el usuario',
      evaluationNotFound: 'Error no se encontró evaluaciones',
      errorGettingInfos: 'Error al traer las informaciones del usuario, intente novamente',
      userHaventEvaluations: 'Usted aún no tiene evaluaciones',
      histogramTitle: 'Historico de evaluaciones',
      pentagramGraph: 'Vision general por año',
      searchPlaceholder: 'Buscar Evaluaciones',
      administration: 'Administración',
      romboTitle: 'Vision general por año',
      alreadyExists: '¡El elemente ya existe!',
      unasigned: 'No asignados',
      golbalView: 'Visión general',
      saveTeam: 'Guardar Time',
      teamModalTitle: 'Sus times',
      confirmRemove: '¿Estás seguro que desas borrar este time?',
      teamSaved: '¡Time salvo con suceso!',
      teamRemoved: '¡Time borrado con suceso!',
      profileDetailsEdit: 'Editar perfil',
      companyDetailsEdit: 'Editar empresa',
      profileEditLabel: 'Configuración de perfil',
      profileEditName: 'Nombre',
      profileEditPass: 'Nueva contraseña',
      profileEditConfirmPass: 'Confirmar nueva contraseña',
      profileEditErrorPassword: 'Las contraseñas no coinciden',
      companyEditLabel: 'Configuración de la organización',
      companyEditName: 'Nombre de la organización',
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
      hired: 'Contratado desde',
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
    AdminLevels: {
      placeholder:'Adicionar nuevo level',
      tableHeaders: ['nombre', 'career', ''],
      title: 'Levels en Lexart',
      success: '¡Operación completada con suceso!',
      error: 'No fue possible completar la operación.',
      errorDelete: 'No se puede eliminar un nivel relacionado con un usuario'
    },
    AdminOrigins: {
      placeholder: 'Adicionar una plataforma',
      title: 'Orígenes',
      tableHeaders: ['id', 'plataforma'],
      deleteError: 'Error: Por favor, asegúrese de que esta plataforma no esté asociada con ningún usuario.',
    },
    generic: {
      cancel: 'Cancelar',
      save: 'Guardar',
      date: 'Fecha',
      edit: 'Editar',
      close: 'Cerrar',
      import: 'Importar',
      remove: 'Borrar',
      topic: 'Topico',
      score: 'Puntaje',
      order: 'Ordenar',
      observations: 'Observaciones',
      yes: 'SI',
      no: 'NO',
      next: 'Próximo',
      back: 'Atrás',
      exit: 'Cerrar sección',
      technologies: 'Tecnologías',
      hunting: 'Times',
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
      asignments: 'Atributos',
      searchPlaceholderEvaluations: 'Buscar evaluaciones',
      Evaluations: 'Evaluaciones',
      Dashboard: 'Dashboard',
      performance: 'Desempeño',
      humanFactor: 'Factor humano',
      skills: 'Habilidades',
      lead: 'Liderazgo',
      leadTree: 'Mapa de Liderazgo',
      minimumTimeReached: '¡Nuevo cargo disponible!',
      personify: 'Personificar developer',
      search: 'Buscar',
      warning: '¡Atencion!',
      days: 'días',
      origin: 'Origin',
      continuity: 'Continuidade',
      collaborators: 'Colaboradores',
      month: 'Mes',
      year: 'Año',
      hours: 'Horas',
      minutes: 'Minutos',
      seconds:' Segundos',
      all: 'Todos',
      name: 'Nombre',
      userType: 'Tipo usuario',
      password: 'Contraseña',
      payments: 'Pagos',
      careerType: 'Tipo de carrera',
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
    AdminContinuity: {
      title: 'Continuidade',
      newBtn: 'Reporte',
      searchPlaceholder: 'Buscar reporte de horas',
      headers: [ 'Id', 'Usuario', 'Mes', 'Año', 'Horas'],
      modalTitle: 'Reportes',
      colaborator: 'Colaborador',
      errorMsgs: {
        month: 'Si requiere un mes',
        year: 'Año invalido',
        user: 'Por favor, elige a un colaborador',
        continuity: 'Valor de horas inválido. Por favor, inserir en el formato HH:MM:SS',
      },
    },
    AdminCareerType: {
      placeholder: 'Adicionar nuevo tipo de carreira',
      title: 'Career Type',
      confirmRemove: '¿Está seguro de que desea eliminar este tipo de carrera?',
      tableHeaders: ['id', 'nombre'],
      deleteError: 'Error: Please make sure this plataform is not related to any user.',
      duplicateError: 'Este tipo de carrera ya existe',
      careerIsUsed: 'Este tipo de carrera se está utilizando'
    },
    AdminCollaborators: {
      title: 'Colaboradores',
      newBtn: 'Colaborador',
      searchPlaceholder: 'Buscar por colaborador',
      headers: [ 'Id', 'Usuario', 'Mes', 'Año', 'Horas'],
      modalTitle: 'Colaborador',
      colaborator: 'Colaborador',
      successToAdd: "Usuario editado/creado correctamente",
      errorToAdd: "Error al intentar editar/crear un usuario"
    },
    AdminPayments: {
      title: 'Pagos',
      headers: ['Id', 'Nombre', 'Sueldo', 'Moneda', 'Facturación', 'Creado', 'Actualizado'],
      modalTitle: 'Sueldo',
      colaborator: 'Colaborador',
      newBtn: 'Sueldo',
      currency: 'Moneda',
      billing: 'Facturación',
      promotion: 'Fecha de promoción',
      salary: 'Sueldo',
      errorMsgs: {
        salary: '¡Sueldo es requerido!',
        user: 'Por favor, eleige a un colaborador.',
        billing: 'Por favor especificar el periodo de facturación.',
        date: 'Por favor especificar un afecha de promocción.',
        currency: 'Moneda es un campo requerido',
      },
    },
  },
  en: {
    dashboard: {
      messageSyncStatus: 'Synchronized user',
      messageNotSyncStatus: 'Your user is not synced!',
      messageSync: 'User successfully synced',
      messageNotSync: 'Failed to sync user',
      evaluationNotFound: 'Error no reviews found',
      userHaventEvaluations: "You haven't evaluations yet",
      errorGettingInfos: 'Error getting user infos, try again',
      histogramTitle: 'Evaluation history',
      pentagramGraph: 'Overview by year',
      searchPlaceholder: 'Search Evaluations',
      administration: 'Administration',
      romboTitle: 'Overview by year',
      alreadyExists: 'This item already exists!',
      unasigned: 'Unasigneds',
      golbalView: 'Global Overview',
      saveTeam: 'Save Team',
      teamModalTitle: 'Your Teams',
      confirmRemove: 'Are you sure you want to remove this team?',
      teamSaved: 'Team successfully saved!',
      teamRemoved: 'Team successfully removed',
      profileDetailsEdit: 'Edit profile',
      companyDetailsEdit: 'Edit company',
      profileEditLabel: 'Profile settings',
      profileEditName: 'Name',
      profileEditPass: 'New password',
      profileEditConfirmPass: 'Confirm new password',
      profileEditErrorPassword: 'Passwords dont match',
      companyEditLabel: 'Company settings',
      companyEditName: 'Company',
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
      hired: 'Hired from',
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
      placeholder:'Add a new level',
      tableHeaders: ['id', 'name', 'plataform', ''],
      title: 'Lexart stack',
      success: 'Operation ran sucessfully',
      error: 'Error when saving this operation',
    },
    AdminLevels: {
      placeholder:'Add a new level',
      tableHeaders: ['name', 'career', ''],
      title: 'Lexart stack',
      success: 'Operation ran sucessfully',
      error: 'Error when saving this operation',
      errorDelete: "Can't delete a level related to a user",
    },
    AdminOrigins: {
      placeholder: 'Add new plataform',
      title: 'Origins',
      tableHeaders: ['id', 'plataform'],
      deleteError: 'Error: Please make sure this plataform is not related to any user.',
    },
    AdminCareerType: {
      placeholder: 'Add new career type',
      confirmRemove: 'Are you sure you want to delete this career type?',
      title: 'Career Type',
      tableHeaders: ['id', 'name'],
      deleteError: 'Error: Please make sure this plataform is not related to any user.',
      duplicateError: 'This career type already exists',
      careerIsUsed: 'This type of career is being used'
    },
    generic: {
      cancel: 'Cancel',
      save: 'Save',
      date: 'Date',
      edit: 'Edit',
      close: 'Close',
      import: 'Import',
      remove: 'Delete',
      topic: 'Topic',
      score: 'Score',
      order: 'Order by',
      observations: 'Observations',
      yes: 'YES',
      no: 'NO',
      next: 'Next',
      back: 'Bcak',
      exit: 'Log out',
      technologies: 'Technologies',
      hunting: 'Teams',
      months: [
        "January",
        "February",
        "March",
        "April",
        "May",
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
      personify: 'Personify developer',
      search: 'Search',
      warning: 'Warning',
      days: 'days',
      origin: 'Origin',
      continuity: 'Continuity',
      collaborators: 'Collaborators',
      month: 'Month',
      year: 'Year',
      hours: 'Hours',
      minutes: 'Minutes',
      seconds:' Seconds',
      all: 'All',
      name: 'Name',
      userType: 'User type',
      password: 'Password',
      payments: 'Payments',
      careerType: 'Career Type',
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
    AdminContinuity: {
      title: 'Continuity',
      newBtn: 'Report',
      searchPlaceholder: 'Search time report',
      headers: [ 'Id', 'User', 'Month', 'Year', 'Hours'],
      modalTitle: 'Reports',
      colaborator: 'Colaborator',
      errorMsgs: {
        month: 'Month is required',
        year: 'Invalid year',
        user: 'User is required',
        continuity: 'Please, insert a valid report, with minutes and seconds',
      },
    },
    AdminCollaborators: {
      title: 'Collaborators',
      newBtn: 'Collaborator',
      searchPlaceholder: 'Search by collaborator',
      headers: [ 'Id', 'Name', 'email', 'Type', 'Platform', 'Active' ],
      modalTitle: 'Collaborator',
      colaborator: 'Colaborator',
      successToAdd: "User created/edited successfully",
      errorToAdd: "Error trying to create/edit an user"
    },
    AdminPayments: {
      title: 'Payments',
      headers: ['Id', 'Name', 'Salary', 'Currency', 'Billing', 'Created', 'Updated'],
      modalTitle: 'Payment',
      colaborator: 'Colaborator',
      newBtn: 'Salary',
      currency: 'Currency',
      billing: 'Billing',
      promotion: 'Promotion date',
      salary: 'Salary',
      errorMsgs: {
        salary: 'Payment field is required.',
        user: 'User field is required.',
        billing: 'Billing field is required.',
        date: 'Date of promotion is required.',
        currency: 'Currency is requiered.',
      },
    },
  },
  pt: {},
}

export default  translations;
