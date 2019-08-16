const express = require('express')
const graphqlHTTP = require('express-graphql')
const graphql = require('graphql')
const joinMonster = require('join-monster')

// Connect to database
/*const mysql = require('mysql')
const client = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'evento'
});*/
var knex = require('knex')({
    client: 'mysql',
    connection: {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'evento'
    }
});
/*client.connect((err) => {
    if (err) throw err;
    console.log('Connected!');

    console.log('');
});*/



// Define the schema
const Inscrito = new graphql.GraphQLObjectType({
    name: 'Inscrito',
    fields: () => ({
        id: { type: graphql.GraphQLInt },
        nombres: { type: graphql.GraphQLString },
        apellidos: { type: graphql.GraphQLString },
        tipoparticipante: {
            type: TipoParticipante,
            sqlJoin: (inscripcionesTable, tipos_participantesTable, args) => `${inscripcionesTable}.idtipoparticipante = ${tipos_participantesTable}.id`
        },
        pais: {
            type: Pais,
            sqlJoin: (inscripcionesTable, paisesTable, args) => `${inscripcionesTable}.idtipoparticipante = ${paisesTable}.id`
        }
    })
});

Inscrito._typeConfig = {
    sqlTable: 'inscripciones',
    uniqueKey: 'id',
}

var TipoParticipante = new graphql.GraphQLObjectType({
    name: 'TipoParticipante',
    fields: () => ({
        id: { type: graphql.GraphQLInt },
        tipoparticipante: { type: graphql.GraphQLString }
    })
})

TipoParticipante._typeConfig = {
    sqlTable: 'tipos_participantes',
    uniqueKey: 'id'
}

var Pais = new graphql.GraphQLObjectType({
    name: 'Pais',
    fields: () => ({
        pais: { type: graphql.GraphQLString },
        descripcion: { type: graphql.GraphQLString },
        codigo: { type: graphql.GraphQLString }
    })
})

Pais._typeConfig = {
    sqlTable: 'paises',
    uniqueKey: 'id'
}

const MutationRoot = new graphql.GraphQLObjectType({
    name: 'Mutation',
    fields: () => ({
        inscrito: {
            type: Inscrito,
            args: {
                nombres: { type: graphql.GraphQLString },
                apellidos: { type: graphql.GraphQLString },
                idtipoparticipante: { type: graphql.GraphQLNonNull(graphql.GraphQLInt) },
            },
            resolve: async(parent, args, context, resolveInfo) => {
                try {
                    return (await client.query("INSERT INTO Inscripciones (nombres, apellidos, idtipoparticipante) VALUES ($1, $2, $3) RETURNING *", [args.nombres, args.apellidos, args.idtipoparticipante])).rows[0]
                } catch (err) {
                    throw new Error("Failed to insert new player")
                }
            }
        }
    })
})

const QueryRoot = new graphql.GraphQLObjectType({
    name: 'Query',
    fields: () => ({
        hello: {
            type: graphql.GraphQLString,
            resolve: () => "Hola Evento"
        },
        inscritos: {
            type: new graphql.GraphQLList(Inscrito),
            resolve: (parent, args, context, resolveInfo) => {
                return joinMonster.default(resolveInfo, {}, sql => {
                    sql = sql.replace(/\"/g, '')
                    console.log(sql);
                    return knex.raw(sql)
                        // client.query(sql)
                })
            }
        },
        inscrito: {
            type: Inscrito,
            args: { id: { type: graphql.GraphQLNonNull(graphql.GraphQLInt) } },
            where: (inscripcionesTable, args, context) => `${inscripcionesTable}.id = ${args.id}`,
            resolve: (parent, args, context, resolveInfo) => {
                return joinMonster.default(resolveInfo, {}, sql => {
                    console.log("antes:" + sql);
                    sql = sql.replace(/\"/g, '')
                    console.log(sql);
                    return knex.raw(sql)
                        // client.query(sql)
                })
            }
        },
        tiposparticipantes: {
            type: new graphql.GraphQLList(TipoParticipante),
            resolve: (parent, args, context, resolveInfo) => {
                return joinMonster.default(resolveInfo, {}, sql => {
                    sql = sql.replace(/\"/g, '')
                    return knex.raw(sql)
                        // client.query(sql)
                })
            }
        },
        tipoparticipante: {
            type: TipoParticipante,
            args: { id: { type: graphql.GraphQLNonNull(graphql.GraphQLInt) } },
            where: (tipos_participantesTable, args, context) => `${tipos_participantesTable}.id = ${args.id}`,
            resolve: (parent, args, context, resolveInfo) => {
                return joinMonster.default(resolveInfo, {}, sql => {
                    sql = sql.replace(/\"/g, '')
                    return knex.raw(sql)
                        // client.query(sql)
                })
            }
        },
        paises: {
            type: new graphql.GraphQLList(Pais),
            resolve: (parent, args, context, resolveInfo) => {
                return joinMonster.default(resolveInfo, {}, sql => {
                    sql = sql.replace(/\"/g, '')
                    return knex.raw(sql)
                        // client.query(sql)
                })
            }
        },
        pais: {
            type: Pais,
            args: { id: { type: graphql.GraphQLNonNull(graphql.GraphQLInt) } },
            where: (paisesTable, args, context) => `${paisesTable}.id = ${args.id}`,
            resolve: (parent, args, context, resolveInfo) => {
                return joinMonster.default(resolveInfo, {}, sql => {
                    sql = sql.replace(/\"/g, '')
                    return knex.raw(sql)
                        // client.query(sql)
                })
            }
        },
    })
})

const schema = new graphql.GraphQLSchema({
    query: QueryRoot,
    mutation: MutationRoot
});

// Create the Express app
const app = express();
app.use('/api', graphqlHTTP({
    schema: schema,
    graphiql: true
}));
const port = 8901
app.listen(port, () => {
    console.log(`Servidor está escuchando en http://localhost:${port}/api`)
})