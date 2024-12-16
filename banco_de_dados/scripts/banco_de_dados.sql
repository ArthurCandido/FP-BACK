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
	horario timestamp not null,
	cpf_usuario varchar references usuario(cpf) not null,
	entrada_saida boolean not null,
	primary key(horario, cpf_usuario)
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

