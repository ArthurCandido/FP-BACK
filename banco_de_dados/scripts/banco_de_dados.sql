\c gabi;

create table usuario(
	cpf varchar primary key,
	email varchar not null,
	senha varchar not null,
	tipo varchar not null,
	nome varchar not null
);

create table documento(
	caminho serial primary key,
	nome varchar not null,
	cpf_usuario varchar references usuario(cpf) not null
);

create table ponto(
	dia date not null,
	horario_entrada timestamp not null,
	horario_saida timestamp not null,
	descricao varchar references usuario(cpf) not null,
	cpf_usuario varchar references usuario(cpf) not null,
	primary key(dia, cpf_usuario)
);

create table holerite(
	mes int not null,
	ano int not null,
	cpf_usuario varchar references usuario(cpf) not null,
	caminho_documento serial references documento(caminho) not null,
	primary key(mes, ano, cpf_usuario)
);

create table nota_fiscal(
	mes int not null,
	ano int not null,
	cpf_usuario varchar references usuario(cpf) not null,
	caminho_documento serial references documento(caminho) not null,
	primary key(mes, ano, cpf_usuario)
);