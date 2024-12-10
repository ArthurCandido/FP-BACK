create table if not exists usuario(
	cpf varchar primary key,
	email varchar not null,
	senha varchar not null,
	tipo varchar not null
);

create table if not exists documento(
	caminho varchar primary key
);

create table if not exists ponto(
	horario timestamp not null,
	cpf_usuario varchar references usuario(cpf) not null,
	entrada_saida boolean not null,
	primary key(horario, cpf_usuario)
);

create table if not exists holerite(
	mes int not null,
	ano int not null,
	cpf_usuario varchar references usuario(cpf) not null,
	caminho_documento varchar references documento(caminho) not null,
	primary key(mes, ano, cpf_usuario)
);

create table if not exists nota_fiscal(
	mes int not null,
	ano int not null,
	cpf_usuario varchar references usuario(cpf) not null,
	caminho_documento varchar references documento(caminho) not null,
	primary key(mes, ano, cpf_usuario)
);
