import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column('decimal', { precision: 5, scale: 2 })
    price: number;

    @Column()
    description: string;

    @Column({ default: 0 })
    @Index()
    viewCount: number;

    @Column({ default: false })
    @Index()
    isDeleted: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}